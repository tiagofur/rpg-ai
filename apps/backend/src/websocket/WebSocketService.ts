import { Server, Socket } from 'socket.io';
import { IWebSocketManager } from './interfaces/IWebSocketManager.js';
import { AuthenticationService, ITokenPayload } from '../services/AuthenticationService.js';
import { ILogger } from '../logging/interfaces/ILogger.js';
import { GameService } from '../game/GameService.js';
import { CommandType } from '../game/interfaces.js';
import { actionResolutionSchema, playerActionSchema } from '../shared/index.js';

export class WebSocketService implements IWebSocketManager {
    private io: Server;
    private readonly authService: AuthenticationService;
    private readonly logger: ILogger;
    private readonly gameService: GameService;

    // Maps to track connections
    private readonly userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

    private readonly sessionSockets: Map<string, Set<string>> = new Map(); // sessionId -> Set<socketId>

    private readonly socketUser: Map<string, string> = new Map(); // socketId -> userId

    private readonly socketSession: Map<string, string> = new Map(); // socketId -> sessionId

    constructor(io: Server, authService: AuthenticationService, gameService: GameService, logger: ILogger) {
        this.io = io;
        this.authService = authService;
        this.gameService = gameService;
        this.logger = logger;
        this.initialize();
    }

    private initialize(): void {
        // Listen to Game Engine events
        const engine = this.gameService.getEngine();
        engine.on('command:executed', (data) => void this.handleCommandExecuted(data));

        // Middleware de autenticación
        this.io.use(async (socket, next) => {
            try {
                const { token } = socket.handshake.auth as { token?: string };
                if (!token) {
                    return next(new Error('Authentication error: Token required'));
                }

                const decoded = await this.authService.verifyToken(token);
                socket.data.user = decoded;
                next();
            } catch (error) {
                this.logger.error(`WebSocket auth failed: ${error instanceof Error ? error.message : String(error)}`);
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            void this.handleConnection(socket);
        });
    }

    private async handleConnection(socket: Socket): Promise<void> {
        const user = socket.data.user as ITokenPayload;
        const { userId, sessionId } = user;

        this.logger.info(`Socket connected: ${socket.id} (User: ${userId})`);

        // Registrar socket
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
            userSocketSet.add(socket.id);
        }

        if (!this.sessionSockets.has(sessionId)) {
            this.sessionSockets.set(sessionId, new Set());
        }
        const sessionSocketSet = this.sessionSockets.get(sessionId);
        if (sessionSocketSet) {
            sessionSocketSet.add(socket.id);
        }

        this.socketUser.set(socket.id, userId);
        this.socketSession.set(socket.id, sessionId);

        // Unirse a sala personal
        await socket.join(`user:${userId}`);
        await socket.join(`auth_session:${sessionId}`); // Renamed to avoid confusion with game session

        // Manejar eventos
        socket.on('disconnect', () => {
            this.handleDisconnect(socket);
        });

        socket.on('join_game', async (gameSessionId: string) => {
            // Verify user has access to this session? For now, just join.
            await socket.join(`session:${gameSessionId}`);

            if (!this.sessionSockets.has(gameSessionId)) {
                this.sessionSockets.set(gameSessionId, new Set());
            }
            this.sessionSockets.get(gameSessionId)?.add(socket.id);

            // Map socket to game session for cleanup
            this.socketSession.set(socket.id, gameSessionId);

            this.logger.info(`Socket ${socket.id} joined game session:${gameSessionId}`);
        });

        socket.on('player:action', async (payload, ack) => {
            await this.handlePlayerAction(socket, payload, ack);
        });

        socket.on('chat:message', (payload) => {
            // TODO: Implement chat
            if (payload && typeof payload === 'object' && 'locationId' in payload) {
                const locId = (payload as { locationId: string }).locationId;
                this.broadcast('chat:message', payload, `location:${locId}`);
            }
        });

        socket.on('join_location', async (locationId: string) => {
            // Leave previous location rooms
            for (const room of socket.rooms) {
                if (room.startsWith('location:')) {
                    await socket.leave(room);
                }
            }
            await socket.join(`location:${locationId}`);
            this.logger.info(`Socket ${socket.id} joined location:${locationId}`);
        });
    }

    private handleDisconnect(socket: Socket): void {
        const userId = this.socketUser.get(socket.id);
        const sessionId = this.socketSession.get(socket.id);

        if (userId) {
            const userSockets = this.userSockets.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    this.userSockets.delete(userId);
                }
            }
            this.socketUser.delete(socket.id);
        }

        if (sessionId) {
            const sessionSockets = this.sessionSockets.get(sessionId);
            if (sessionSockets) {
                sessionSockets.delete(socket.id);
                if (sessionSockets.size === 0) {
                    this.sessionSockets.delete(sessionId);
                }
            }
            this.socketSession.delete(socket.id);
        }

        this.logger.info(`Socket disconnected: ${socket.id}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async handleCommandExecuted(data: any): Promise<void> {
        if (!data.success || !data.result) return;

        const { sessionId, result } = data;

        // Find sockets for this session
        const socketIds = this.sessionSockets.get(sessionId);
        if (!socketIds || socketIds.size === 0) return;

        // Broadcast to location room
        // We assume the first socket is representative for the location
        const socketId = socketIds.values().next().value;
        if (!socketId) return;

        const socket = this.io.sockets.sockets.get(socketId);

        if (socket) {
            let locationRoom: string | undefined;
            for (const room of socket.rooms) {
                if (room.startsWith('location:')) {
                    locationRoom = room;
                    break;
                }
            }

            if (locationRoom) {
                // Broadcast narration to others in the room
                socket.to(locationRoom).emit('game:event', {
                    type: 'narrative',
                    sourceId: sessionId,
                    message: result.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async handlePlayerAction(socket: Socket, rawPayload: unknown, ack?: (response: any) => void): Promise<void> {
        const parsed = playerActionSchema.safeParse(rawPayload);

        if (!parsed.success) {
            if (ack) ack({ error: parsed.error.flatten() });
            return;
        }

        try {
            const engine = this.gameService.getEngine();
            const result = await engine.executeCommand(
                parsed.data.sessionId,
                CommandType.CUSTOM,
                { input: parsed.data.action }
            );

            const resolution = actionResolutionSchema.parse({
                narration: result.message,
                stateChanges: result.newState || {},
                imageTrigger: false, // TODO: Obtener esto del resultado del comando
                version: "1.0"
            });

            // Enviar respuesta al jugador
            socket.emit("player:resolution", resolution);

            // Si hubo cambio de ubicación, actualizar salas
            // Esto requiere que el resultado del comando incluya info de ubicación

            if (ack) ack({ ok: true });

        } catch (error) {
            this.logger.error(`Error executing command: ${error}`);
            if (ack) ack({ error: error instanceof Error ? error.message : "Unknown error" });
        }
    }

    // IWebSocketManager implementation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public broadcast(event: string, data: any, room?: string): void {
        if (room) {
            this.io.to(room).emit(event, data);
        } else {
            this.io.emit(event, data);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public sendToUser(userId: string, event: string, data: any): void {
        this.io.to(`user:${userId}`).emit(event, data);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public sendToSession(sessionId: string, event: string, data: any): void {
        this.io.to(`session:${sessionId}`).emit(event, data);
    }

    public joinRoom(socketId: string, room: string): void {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
            void socket.join(room);
        }
    }

    public leaveRoom(socketId: string, room: string): void {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
            void socket.leave(room);
        }
    }

    public getConnectedUsers(): Array<string> {
        return Array.from(this.userSockets.keys());
    }

    public isUserConnected(userId: string): boolean {
        return this.userSockets.has(userId);
    }

    public disconnectUser(userId: string): void {
        const socketIds = this.userSockets.get(userId);
        if (socketIds) {
            for (const socketId of socketIds) {
                const socket = this.io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.disconnect(true);
                }
            }
        }
    }
}
