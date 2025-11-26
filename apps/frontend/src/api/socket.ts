import { io, Socket } from 'socket.io-client';

const API_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3333';

// ============================================================================
// Types
// ============================================================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface GameEvent {
    type: string;
    payload: unknown;
    timestamp: number;
}

export interface NarrativeUpdate {
    text: string;
    type: 'narration' | 'dialogue' | 'action' | 'system';
    speaker?: string;
}

export interface CharacterUpdate {
    hp?: number;
    mp?: number;
    xp?: number;
    level?: number;
    gold?: number;
    inventory?: unknown[];
}

// Socket event types
export interface ServerToClientEvents {
    narrative: (data: NarrativeUpdate) => void;
    character_update: (data: CharacterUpdate) => void;
    combat_start: (data: { enemies: unknown[] }) => void;
    combat_end: (data: { victory: boolean; rewards?: unknown }) => void;
    error: (data: { message: string; code?: string }) => void;
    player_joined: (data: { playerId: string; username: string }) => void;
    player_left: (data: { playerId: string }) => void;
    game_state: (data: unknown) => void;
    // Game Engine Events
    'game:event': (data: GameEvent) => void;
    'player:resolution': (data: unknown) => void;
}

export interface ClientToServerEvents {
    join_game: (sessionId: string, callback?: (response: unknown) => void) => void;
    leave_game: (sessionId: string) => void;
    player_action: (data: { action: string; params?: unknown }) => void;
    send_message: (data: { text: string }) => void;
    join_location: (locationId: string) => void;
}

type EventCallback<T = unknown> = (data: T) => void;

// ============================================================================
// WebSocket Service
// ============================================================================

class WebSocketService {
    private socket: Socket | null = null;
    private token: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
    private _status: ConnectionStatus = 'disconnected';

    get status(): ConnectionStatus {
        return this._status;
    }

    private setStatus(status: ConnectionStatus) {
        this._status = status;
        this.statusListeners.forEach((listener) => listener(status));
    }

    // Subscribe to connection status changes
    onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
        this.statusListeners.add(callback);
        // Immediately call with current status
        callback(this._status);
        // Return unsubscribe function
        return () => this.statusListeners.delete(callback);
    }

    connect(token: string) {
        if (this.socket?.connected) {
            return;
        }

        this.token = token;
        this.setStatus('connecting');

        this.socket = io(API_URL, {
            auth: { token },
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay,
            reconnectionDelayMax: 5000,
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            this.reconnectAttempts = 0;
            this.setStatus('connected');
        });

        this.socket.on('disconnect', (reason) => {
            this.setStatus('disconnected');

            // If the server disconnected us, try to reconnect
            if (reason === 'io server disconnect' && this.token) {
                this.socket?.connect();
            }
        });

        this.socket.on('connect_error', () => {
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.setStatus('error');
            }
        });

        this.socket.io.on('reconnect', () => {
            this.reconnectAttempts = 0;
            this.setStatus('connected');
        });

        this.socket.io.on('reconnect_failed', () => {
            this.setStatus('error');
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.token = null;
            this.setStatus('disconnected');
        }
    }

    // Reconnect with new token (e.g., after token refresh)
    reconnect(newToken?: string) {
        const tokenToUse = newToken || this.token;
        if (!tokenToUse) return;

        this.disconnect();
        this.connect(tokenToUse);
    }

    // -------------------------------------------------------------------------
    // Emit Methods
    // -------------------------------------------------------------------------

    emit<K extends keyof ClientToServerEvents>(
        event: K,
        ...args: Parameters<ClientToServerEvents[K]>
    ) {
        if (this.socket?.connected) {
            this.socket.emit(event, ...args);
        }
    }

    // Generic emit for backwards compatibility
    emitRaw(event: string, data: unknown, ack?: (response: unknown) => void) {
        if (this.socket?.connected) {
            this.socket.emit(event, data, ack);
        }
    }

    // -------------------------------------------------------------------------
    // Listen Methods
    // -------------------------------------------------------------------------

    on<K extends keyof ServerToClientEvents>(
        event: K,
        callback: ServerToClientEvents[K]
    ): void {
        if (this.socket) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.socket.on(event, callback as any);
        }
    }

    off<K extends keyof ServerToClientEvents>(
        event: K,
        callback?: ServerToClientEvents[K]
    ): void {
        if (this.socket) {
            if (callback) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.socket.off(event, callback as any);
            } else {
                this.socket.off(event);
            }
        }
    }

    // Generic listeners for backwards compatibility
    onRaw(event: string, callback: EventCallback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    offRaw(event: string, callback?: EventCallback) {
        if (this.socket) {
            if (callback) {
                this.socket.off(event, callback);
            } else {
                this.socket.off(event);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Game-specific Methods
    // -------------------------------------------------------------------------

    joinGame(sessionId: string, callback?: (response: unknown) => void) {
        this.emit('join_game', sessionId, callback);
    }

    leaveGame(sessionId: string) {
        this.emit('leave_game', sessionId);
    }

    sendPlayerAction(action: string, params?: unknown) {
        this.emit('player_action', { action, params });
    }

    sendMessage(text: string) {
        this.emit('send_message', { text });
    }

    joinLocation(locationId: string) {
        this.emit('join_location', locationId);
    }
}

export const socketService = new WebSocketService();
