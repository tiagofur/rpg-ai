import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'node:events';
import {
  IGameCommand,
  IGameContext,
  IGameState,
  ICharacter,
  ICommandResult,
  IGameEvent,
  IEquipment,
  IGameEntity,
  GamePhase,
  UUID,
  ISOTimestamp
} from './interfaces.js';
import { GameCommandFactory, ICommandFactory } from './commands/GameCommandFactory.js';
import { SessionLockManager, ISessionLockManager } from './SessionLockManager.js';
import { ILogger } from '../logging/interfaces/ILogger.js';
import { ConsoleLogger } from '../logging/ConsoleLogger.js';
import { AIGatewayService } from '../ai/AIGatewayService.js';
import { IAIService } from '../ai/interfaces/IAIService.js';
import { createLocation, LOCATIONS } from './content/Locations.js';
import { createEnemy } from './content/Enemies.js';
import { IRedisClient } from '../cache/interfaces/IRedisClient.js';

/**
 * Configuración del Game Engine
 */
export interface IGameEngineConfig {
  redis: IRedisClient;
  prisma: PrismaClient;
  maxUndoStackSize: number;
  maxEventHistorySize: number;
  autoSaveInterval: number; // en milisegundos
  maxConcurrentSessions: number;
  enableAI: boolean;
  enablePersistence: boolean;
  enableEventLogging: boolean;
  enableMetrics: boolean;
}

/**
 * Métricas del Game Engine
 */
export interface IGameEngineMetrics {
  totalCommandsExecuted: number;
  totalSessions: number;
  activeSessions: number;
  averageCommandExecutionTime: number;
  errorRate: number;
  cacheHitRate: number;
  memoryUsage: number;
}

/**
 * Estado de una sesión de juego
 */
export interface IGameSession {
  sessionId: UUID;
  userId: UUID;
  characterId: UUID;
  state: IGameState;
  createdAt: ISOTimestamp;
  lastActivity: ISOTimestamp;
  isActive: boolean;
  undoStack: Array<{
    command: IGameCommand;
    result: ICommandResult;
  }>;
  redoStack: Array<{
    command: IGameCommand;
    result: ICommandResult;
  }>;
  settings: IGameSettings;
}

/**
 * Configuración del juego
 */
export interface IGameSettings {
  difficulty: 'easy' | 'normal' | 'hard' | 'legendary';
  enablePermadeath: boolean;
  enableIronman: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number;
  enableCombatLog: boolean;
  enableEventNotifications: boolean;
  language: string;
  theme: 'light' | 'dark' | 'auto';
}

/**
 * Game Engine principal
 * Implementa el patrón Command con soporte para undo/redo, eventos, y persistencia
 */
export class GameEngine extends EventEmitter {
  private readonly config: IGameEngineConfig;

  private readonly redis: IRedisClient;

  private readonly prisma: PrismaClient;

  private readonly activeSessions: Map<UUID, IGameSession> = new Map();

  private readonly metrics: IGameEngineMetrics;

  private isShuttingDown: boolean = false;

  private autoSaveTimer?: NodeJS.Timeout;

  private cleanupTimer?: NodeJS.Timeout;

  private metricsTimer?: NodeJS.Timeout;

  private readonly sessionLockManager: ISessionLockManager;

  private readonly logger: ILogger;

  private readonly commandFactory: ICommandFactory;

  private readonly aiService?: IAIService;

  constructor(config: IGameEngineConfig) {
    super();
    this.config = config;
    this.redis = config.redis;
    this.prisma = config.prisma;
    this.logger = new ConsoleLogger('GameEngine');

    // Inicializar AI Service si está habilitado
    if (config.enableAI) {
      this.aiService = new AIGatewayService(process.env['GOOGLE_AI_API_KEY'] || '', this.redis);
    }

    // Inicializar Command Factory con AI Service
    this.commandFactory = new GameCommandFactory(this.aiService);

    // Inicializar SessionLockManager
    this.sessionLockManager = new SessionLockManager(this.redis, this.logger, {
      defaultTimeoutMs: 30_000, // 30 segundos
      lockTimeoutMs: 60_000 // 60 segundos
    });

    // Inicializar métricas
    this.metrics = {
      totalCommandsExecuted: 0,
      totalSessions: 0,
      activeSessions: 0,
      averageCommandExecutionTime: 0,
      errorRate: 0,
      cacheHitRate: 0,
      memoryUsage: 0
    };

    // Inicializar el sistema
    this.initialize();
  }

  /**
   * Inicializa el Game Engine
   */
  private initialize(): void {
    // Configurar auto-guardado
    if (this.config.enablePersistence && this.config.autoSaveInterval > 0) {
      this.setupAutoSave();
    }

    // Configurar limpieza periódica
    this.setupPeriodicCleanup();

    // Configurar monitoreo de métricas
    if (this.config.enableMetrics) {
      this.setupMetricsCollection();
    }

    this.emit('engine:initialized');
  }

  /**
   * Crea una nueva sesión de juego o inicializa una existente
   */
  async createSession(userId: UUID, characterId: UUID, settings?: Partial<IGameSettings>, existingSessionId?: UUID): Promise<IGameSession> {
    if (this.activeSessions.size >= this.config.maxConcurrentSessions) {
      throw new Error('Maximum concurrent sessions reached');
    }

    const sessionId = existingSessionId || uuidv4();
    const now = new Date().toISOString();

    // Configuración por defecto
    const defaultSettings: IGameSettings = {
      difficulty: 'normal',
      enablePermadeath: false,
      enableIronman: false,
      enableAutoSave: true,
      autoSaveInterval: 300_000, // 5 minutos
      enableCombatLog: true,
      enableEventNotifications: true,
      language: 'en',
      theme: 'auto'
    };

    const finalSettings = { ...defaultSettings, ...settings };

    // Crear estado inicial del juego
    const initialState = await this.createInitialGameState(sessionId, userId, characterId);

    const session: IGameSession = {
      sessionId,
      userId,
      characterId,
      state: initialState,
      createdAt: now,
      lastActivity: now,
      isActive: true,
      undoStack: [],
      redoStack: [],
      settings: finalSettings
    };

    // Guardar en memoria
    this.activeSessions.set(sessionId, session);

    // Guardar en Redis para persistencia rápida
    if (this.config.enablePersistence) {
      await this.saveSessionToRedis(session);
    }

    // Guardar en base de datos para persistencia completa
    if (this.config.enablePersistence) {
      await this.saveSessionToDatabase(session);
    }

    this.metrics.totalSessions++;
    this.metrics.activeSessions = this.activeSessions.size;

    this.emit('session:created', { sessionId, userId, characterId });

    return session;
  }

  /**
   * Ejecuta un comando en una sesión con bloqueo de concurrencia
   */
  async executeCommand(
    sessionId: UUID,
    commandType: string,
    parameters: Record<string, unknown> = {},
    userId?: UUID
  ): Promise<ICommandResult> {
    const startTime = Date.now();
    const owner = userId || `system:${uuidv4()}`;

    // Ejecutar comando con bloqueo de sesión para prevenir condiciones de carrera
    return this.sessionLockManager.withSessionLock(
      sessionId,
      owner,
      async () => {
        try {
          // Obtener sesión
          const session = await this.getSession(sessionId);
          if (!session) {
            throw new Error(`Session ${sessionId} not found`);
          }

          // Validar autorización del usuario
          if (userId && session.userId !== userId) {
            throw new Error('User not authorized to execute commands in this session');
          }

          // Actualizar actividad
          session.lastActivity = new Date().toISOString();

          // Crear comando
          const command = this.commandFactory.createCommand(commandType as any);

          // Crear contexto
          const context = await this.createGameContext(session, parameters);

          // Ejecutar comando
          const result = await command.execute(context);

          // Procesar resultado
          await (result.success ? this.processSuccessfulCommand(session, command, result) : this.processFailedCommand(session, command, result));

          // Actualizar métricas
          const executionTime = Date.now() - startTime;
          this.updateCommandMetrics(result.success, executionTime);

          // Guardar cambios
          if (this.config.enablePersistence) {
            await this.saveSessionToRedis(session);
          }

          // Emitir eventos
          this.emit('command:executed', {
            sessionId,
            commandId: command.id,
            commandType,
            success: result.success,
            executionTime,
            result
          });

          return result;

        } catch (error) {
          const executionTime = Date.now() - startTime;
          this.updateCommandMetrics(false, executionTime);

          this.emit('command:error', {
            sessionId,
            commandType,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTime
          });

          throw error;
        }
      }
    );
  }

  /**
   * Deshace el último comando ejecutado con bloqueo de concurrencia
   */
  async undoCommand(sessionId: UUID, userId?: UUID): Promise<ICommandResult> {
    const owner = userId || `system:${uuidv4()}`;

    return this.sessionLockManager.withSessionLock(
      sessionId,
      owner,
      async () => {
        const session = await this.getSession(sessionId);
        if (!session) {
          throw new Error(`Session ${sessionId} not found`);
        }

        if (session.undoStack.length === 0) {
          throw new Error('No commands to undo');
        }

        const lastCommandEntry = session.undoStack.pop()!;
        const { command } = lastCommandEntry;

        // Verificar si el comando se puede deshacer
        if (!command.canUndo()) {
          session.undoStack.push(lastCommandEntry); // Devolver a la pila
          throw new Error('Last command cannot be undone');
        }

        // Deshacer comando
        const context = await this.createGameContext(session);
        const undoResult = await command.undo(context);

        if (undoResult.success) {
          // Mover a la pila de redo
          session.redoStack.push(lastCommandEntry);

          // Actualizar estado del juego
          if (undoResult.restoredState) {
            session.state = { ...session.state, ...undoResult.restoredState };
          }

          this.emit('command:undone', { sessionId, commandId: command.id });
        }

        // Guardar cambios
        if (this.config.enablePersistence) {
          await this.saveSessionToRedis(session);
        }

        // Convert IUndoResult to ICommandResult
        return {
          success: undoResult.success,
          commandId: command.id,
          message: undoResult.message,
          effects: [],
          logEntries: undoResult.logEntries,
          notifications: []
        };
      }
    );
  }

  /**
   * Rehace el último comando deshecho con bloqueo de concurrencia
   */
  async redoCommand(sessionId: UUID, userId?: UUID): Promise<ICommandResult> {
    const owner = userId || `system:${uuidv4()}`;

    return this.sessionLockManager.withSessionLock(
      sessionId,
      owner,
      async () => {
        const session = await this.getSession(sessionId);
        if (!session) {
          throw new Error(`Session ${sessionId} not found`);
        }

        if (session.redoStack.length === 0) {
          throw new Error('No commands to redo');
        }

        const commandEntryToRedo = session.redoStack.pop()!;
        const { command } = commandEntryToRedo;

        // Crear contexto y re-ejecutar
        const context = await this.createGameContext(session);
        const result = await command.execute(context);

        if (result.success) {
          // Mover de vuelta a la pila de undo
          session.undoStack.push(commandEntryToRedo);

          this.emit('command:redone', { sessionId, commandId: command.id });
        }

        // Guardar cambios
        if (this.config.enablePersistence) {
          await this.saveSessionToRedis(session);
        }

        return result;
      }
    );
  }

  /**
   * Obtiene una sesión (desde memoria, Redis o Base de Datos)
   */
  async getSession(sessionId: UUID): Promise<IGameSession | null> {
    // 1. Verificar en memoria
    let session = this.activeSessions.get(sessionId);
    if (session) return session;

    if (!this.config.enablePersistence) return null;

    // 2. Intentar cargar desde Redis
    const loadedFromRedis = await this.loadSessionFromRedis(sessionId);
    if (loadedFromRedis) {
      session = loadedFromRedis;
      this.activeSessions.set(sessionId, session);
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate * 0.9) + (0.1);
      return session;
    }

    // 3. Intentar cargar desde Base de Datos
    const loadedFromDb = await this.loadSessionFromDatabase(sessionId);
    if (loadedFromDb) {
      session = loadedFromDb;
      this.activeSessions.set(sessionId, session);
      // Guardar en Redis para la próxima vez
      await this.saveSessionToRedis(session);
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate * 0.9); // Miss en caché
      return session;
    }

    return null;
  }

  /**
   * Guarda una sesión en Redis
   */
  private async saveSessionToRedis(session: IGameSession): Promise<void> {
    try {
      const sessionKey = `game:session:${session.sessionId}`;

      // Sanitizar los stacks de comandos para serialización
      const sanitizedSession = {
        ...session,
        undoStack: session.undoStack.map(entry => ({
          commandId: entry.command.id,
          commandType: entry.command.type,
          result: entry.result
        })),
        redoStack: session.redoStack.map(entry => ({
          commandId: entry.command.id,
          commandType: entry.command.type,
          result: entry.result
        }))
      };

      const sessionData = JSON.stringify(sanitizedSession);

      await this.redis.setex(sessionKey, 3600, sessionData); // Expira en 1 hora

      // También guardar índice por usuario
      const userSessionsKey = `game:user:${session.userId}:sessions`;
      await this.redis.sadd(userSessionsKey, session.sessionId);

    } catch (error) {
      this.logger.error('Error saving session to Redis', { error });
      throw error;
    }
  }

  /**
   * Carga una sesión desde Redis
   */
  private async loadSessionFromRedis(sessionId: UUID): Promise<IGameSession | null> {
    try {
      const sessionKey = `game:session:${sessionId}`;
      const sessionData = await this.redis.get(sessionKey);

      if (sessionData) {
        return JSON.parse(sessionData) as IGameSession;
      }

      return null;
    } catch (error) {
      this.logger.error('Error loading session from Redis', { error });
      return null;
    }
  }

  /**
   * Guarda una sesión en la base de datos
   */
  private async saveSessionToDatabase(session: IGameSession): Promise<void> {
    try {
      // Sanitizar stacks
      const undoStack = session.undoStack.map(entry => ({
        commandId: entry.command.id,
        commandType: entry.command.type,
        result: entry.result
      }));

      const redoStack = session.redoStack.map(entry => ({
        commandId: entry.command.id,
        commandType: entry.command.type,
        result: entry.result
      }));

      await this.prisma.gameSession.upsert({
        where: { id: session.sessionId },
        update: {
          state: session.state as any,
          activeCharacterId: session.characterId,
          undoStack: undoStack as any,
          redoStack: redoStack as any,
          lastActivity: session.lastActivity,
          isActive: session.isActive,
          settings: session.settings as any
        },
        create: {
          id: session.sessionId,
          ownerId: session.userId,
          activeCharacterId: session.characterId,
          title: 'Game Session',
          seed: 0,
          state: session.state as any,
          undoStack: undoStack as any,
          redoStack: redoStack as any,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          isActive: session.isActive,
          settings: session.settings as any
        }
      });
    } catch (error) {
      this.logger.error('Error saving session to database', { error });
      // No lanzar error para no interrumpir el flujo del juego
    }
  }

  /**
   * Carga una sesión desde la base de datos
   */
  private async loadSessionFromDatabase(sessionId: UUID): Promise<IGameSession | null> {
    try {
      const dbSession = await this.prisma.gameSession.findUnique({
        where: { id: sessionId }
      });

      if (!dbSession) return null;

      // Rehidratar stacks
      const undoStack = await this.rehydrateCommandStack(dbSession.undoStack);
      const redoStack = await this.rehydrateCommandStack(dbSession.redoStack);

      return {
        sessionId: dbSession.id,
        userId: dbSession.ownerId,
        characterId: dbSession.activeCharacterId || '',
        state: dbSession.state as any,
        createdAt: dbSession.createdAt.toISOString(),
        lastActivity: dbSession.lastActivity.toISOString(),
        isActive: dbSession.isActive,
        undoStack,
        redoStack,
        settings: dbSession.settings as any
      };
    } catch (error) {
      this.logger.error('Error loading session from database', { error });
      return null;
    }
  }

  /**
   * Rehidrata una pila de comandos desde JSON
   */
  private async rehydrateCommandStack(stackJson: any): Promise<Array<{ command: IGameCommand; result: ICommandResult }>> {
    if (!Array.isArray(stackJson)) return [];

    const stack: Array<{ command: IGameCommand; result: ICommandResult }> = [];

    for (const entry of stackJson) {
      try {
        if (!entry.commandType) continue;

        // Recrear el comando usando la factory
        const command = this.commandFactory.createCommand(entry.commandType);

        // Restaurar el ID original
        // @ts-ignore - Forzamos la escritura de la propiedad readonly para restauración
        command.id = entry.commandId;

        stack.push({
          command,
          result: entry.result
        });
      } catch (e) {
        this.logger.warn(`Failed to rehydrate command ${entry.commandType}`, { error: e });
      }
    }

    return stack;
  }

  /**
   * Crea el estado inicial del juego
   */
  private async createInitialGameState(
    sessionId: UUID,
    _userId: UUID,
    characterId: UUID
  ): Promise<IGameState> {
    // Cargar personaje desde base de datos
    const character = await this.loadCharacter(characterId);

    // Inicializar entidades (Mundo)
    const entities: Record<UUID, IGameEntity> = {};
    const locationMap = new Map<string, any>(); // templateId -> Location Instance

    // 1. Crear todas las ubicaciones
    for (const templateId of Object.keys(LOCATIONS)) {
      const location = createLocation(templateId);
      locationMap.set(templateId, location);

      entities[location.id] = {
        id: location.id,
        type: 'location',
        data: location as unknown as Record<string, unknown>
      };
    }

    // 2. Conectar ubicaciones (Resolver exits a UUIDs)
    for (const [templateId, location] of locationMap.entries()) {
      const template = LOCATIONS[templateId];
      if (template && template.exits) {
        location.connections = template.exits
          .map((exitId: string) => locationMap.get(exitId)?.id)
          .filter((id: string | undefined) => id !== undefined);
      }

      // Actualizar la entidad con las conexiones resueltas
      if (entities[location.id]) {
        (entities[location.id] as any).data = location as unknown as Record<string, unknown>;
      }
    }

    // 3. Posicionar al personaje en la zona de inicio (Town Square)
    const startLocation = locationMap.get('loc_town_square');
    if (startLocation) {
      // Actualizar posición del personaje en memoria (y opcionalmente en DB)
      (character as any).position = {
        x: startLocation.coordinates.x,
        y: startLocation.coordinates.y,
        z: startLocation.coordinates.z,
        mapId: startLocation.id,
        region: 'town'
      };

      // Agregar personaje a la ubicación
      startLocation.characters.push(character.id);
    }

    // 4. Spawnear enemigos iniciales en zonas salvajes
    for (const [templateId, location] of locationMap.entries()) {
      const template = LOCATIONS[templateId];
      if (template && template.enemyIds && template.enemyIds.length > 0) {
        // Chance de spawnear enemigos
        for (const enemyTemplateId of template.enemyIds) {
          if (Math.random() > 0.5) { // 50% chance
            try {
              const enemy = createEnemy(enemyTemplateId);
              (enemy as any).position = {
                x: location.coordinates.x,
                y: location.coordinates.y,
                z: location.coordinates.z,
                mapId: location.id,
                region: 'wilderness'
              };

              // Agregar a entidades
              entities[enemy.id] = {
                id: enemy.id,
                type: 'enemy',
                data: enemy as unknown as Record<string, unknown>
              };

              // Agregar a la ubicación
              location.characters.push(enemy.id); // Enemies are characters too
            } catch (e) {
              this.logger.warn(`Failed to spawn enemy ${enemyTemplateId}`, { error: e });
            }
          }
        }
      }
    }

    return {
      sessionId,
      currentTurn: 1,
      phase: GamePhase.EXPLORATION,
      activeEffects: [],
      history: [],
      entities
    };
  }

  /**
   * Carga un personaje desde la base de datos
   */
  private async loadCharacter(characterId: UUID): Promise<ICharacter> {
    try {
      const character = await this.prisma.character.findUnique({
        where: { id: characterId }
      });

      if (!character) {
        throw new Error(`Character ${characterId} not found`);
      }

      // Parsear atributos JSON
      const atributos = typeof character.atributos === 'string'
        ? JSON.parse(character.atributos)
        : character.atributos;

      // Crear estructura de personaje completa
      return {
        id: character.id,
        name: character.nombre,
        class: character.clase,
        level: atributos?.nivel || 1,
        experience: atributos?.experiencia || 0,
        health: {
          current: atributos?.vida?.actual || 100,
          maximum: atributos?.vida?.maxima || 100,
          temporaryModifier: 0,
          permanentModifier: 0,
          regenerationRate: 1
        },
        mana: {
          current: atributos?.mana?.actual || 50,
          maximum: atributos?.mana?.maxima || 50,
          temporaryModifier: 0,
          permanentModifier: 0,
          regenerationRate: 0.5
        },
        stamina: {
          current: atributos?.estamina?.actual || 80,
          maximum: atributos?.estamina?.maxima || 80,
          temporaryModifier: 0,
          permanentModifier: 0,
          regenerationRate: 2
        },
        attributes: {
          strength: atributos?.fuerza || 10,
          dexterity: atributos?.destreza || 10,
          intelligence: atributos?.inteligencia || 10,
          wisdom: atributos?.sabiduria || 10,
          constitution: atributos?.constitucion || 10,
          charisma: atributos?.carisma || 10,
          luck: atributos?.suerte || 10
        },
        skills: {}, // Se llenaría con habilidades parseadas
        inventory: {
          maxCapacity: 50,
          currentWeight: 0,
          items: [],
          gold: 0
        },
        equipment: {
          helmet: undefined,
          armor: undefined,
          gloves: undefined,
          boots: undefined,
          weapon: undefined,
          shield: undefined,
          ring1: undefined,
          ring2: undefined,
          amulet: undefined
        } as unknown as IEquipment,
        effects: [],
        faction: 'Neutral',
        isPlayer: true,
        isHostile: false,
        status: [character.estado || 'active'],
        userId: character.playerId
      };
    } catch (error) {
      this.logger.error(`Error loading character ${characterId}`, { error });
      throw new Error(`Failed to load character: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Crea el contexto del juego para ejecutar comandos
   */
  private async createGameContext(
    session: IGameSession,
    parameters: Record<string, unknown> = {}
  ): Promise<IGameContext> {
    const now = new Date().toISOString();

    // Cargar personaje
    const character = await this.loadCharacter(session.characterId);

    return {
      sessionId: session.sessionId,
      userId: session.userId,
      characterId: session.characterId,
      gameState: session.state,
      character,
      location: this.getCurrentLocation(session.state, character),
      party: this.getPartyInfo(session.state),
      timestamp: now,
      metadata: {
        ...parameters,
        sessionSettings: session.settings
      }
    };
  }

  /**
   * Procesa un comando exitoso
   */
  private async processSuccessfulCommand(
    session: IGameSession,
    command: IGameCommand,
    result: ICommandResult
  ): Promise<void> {
    // Actualizar estado del juego
    if (result.newState) {
      session.state = { ...session.state, ...result.newState };
    }

    // Aplicar efectos
    if (result.effects && result.effects.length > 0) {
      await this.applyEffects(session, result.effects);
    }

    // Procesar recompensas
    if (result.rewards && result.rewards.length > 0) {
      await this.processRewards(session, result.rewards);
    }

    // Agregar a la pila de undo
    if (command.canUndo() && session.undoStack.length < this.config.maxUndoStackSize) {
      session.undoStack.push({ command, result });
    }

    // Limpiar pila de redo
    session.redoStack = [];

    // Agregar evento al historial
    const event: IGameEvent = {
      id: uuidv4(),
      type: 'command_executed',
      timestamp: new Date().toISOString(),
      sourceId: session.characterId,
      data: {
        commandId: command.id,
        commandType: command.type,
        success: true,
        result
      }
    };

    (session.state.history).push(event);

    // Limitar tamaño del historial
    if (session.state.history.length > this.config.maxEventHistorySize) {
      (session.state as any).history = session.state.history.slice(-this.config.maxEventHistorySize);
    }
  }

  /**
   * Procesa un comando fallido
   */
  private async processFailedCommand(
    session: IGameSession,
    command: IGameCommand,
    result: ICommandResult
  ): Promise<void> {
    // Agregar evento de error al historial
    const event: IGameEvent = {
      id: uuidv4(),
      type: 'command_failed',
      timestamp: new Date().toISOString(),
      sourceId: session.characterId,
      data: {
        commandId: command.id,
        commandType: command.type,
        error: result.message
      }
    };

    (session.state.history).push(event);
  }

  /**
   * Aplica efectos al estado del juego
   */
  private async applyEffects(session: IGameSession, effects: Array<any>): Promise<void> {
    const character = await this.loadCharacter(session.characterId) as any; // Cast to any to allow mutation

    for (const effect of effects) {
      // Handle different effect types
      switch (effect.type) {
        case 'damage_over_time': // Using as instant damage for now if duration is 0
        case 'damage':
          if (effect.duration === 0) {
            character.health.current = Math.max(0, character.health.current - effect.magnitude);

            // Check for death
            if (character.health.current <= 0) {
              character.status = ['dead'];
              // Add death event/log
              const deathLog = {
                id: uuidv4(),
                timestamp: new Date().toISOString(),
                level: 'info',
                category: 'combat',
                message: `${character.name} has been defeated!`,
                data: { targetId: character.id, type: 'death' }
              };

              session.state.history.push({
                id: uuidv4(),
                type: 'death',
                timestamp: new Date().toISOString(),
                sourceId: character.id,
                data: { message: deathLog.message }
              });
            }
          } else {
            // Add to active effects
            session.state.activeEffects.push(effect);
          }
          break;

        case 'heal_over_time':
        case 'heal':
          if (effect.duration === 0) {
            character.health.current = Math.min(character.health.maximum, character.health.current + effect.magnitude);

            // Check for resurrection
            if (character.health.current > 0 && character.status?.includes('dead')) {
              character.status = character.status.filter((s: string) => s !== 'dead');
              if (character.status.length === 0) character.status.push('active');
            }
          } else {
            session.state.activeEffects.push(effect);
          }
          break;

        case 'buff':
        case 'debuff':
          session.state.activeEffects.push(effect);
          break;
      }
    }

    // Update the character in the database
    // We need to reconstruct the attributes JSON
    const currentAttributes = character.attributes;
    const updatedAttributes = {
      nivel: character.level,
      experiencia: character.experience,
      vida: { actual: character.health.current, maxima: character.health.maximum },
      mana: { actual: character.mana.current, maxima: character.mana.maximum },
      estamina: { actual: character.stamina.current, maxima: character.stamina.maximum },
      fuerza: currentAttributes.strength,
      destreza: currentAttributes.dexterity,
      inteligencia: currentAttributes.intelligence,
      sabiduria: currentAttributes.wisdom,
      constitucion: currentAttributes.constitution,
      carisma: currentAttributes.charisma,
      suerte: currentAttributes.luck
    };

    await this.prisma.character.update({
      where: { id: character.id },
      data: {
        atributos: updatedAttributes,
        estado: character.status?.[0] || 'active'
      }
    });
  }

  /**
   * Procesa recompensas
   */
  private async processRewards(session: IGameSession, rewards: Array<any>): Promise<void> {
    const character = await this.loadCharacter(session.characterId) as any; // Cast to any
    // let levelUp = false;

    for (const reward of rewards) {
      switch (reward.type) {
        case 'experience':
          character.experience += reward.amount;
          // Simple level up logic: Level * 1000
          const nextLevelExp = character.level * 1000;
          if (character.experience >= nextLevelExp) {
            character.level += 1;
            character.experience -= nextLevelExp;
            // levelUp = true;

            // Add level up event
            session.state.history.push({
              id: uuidv4(),
              type: 'levelup',
              timestamp: new Date().toISOString(),
              sourceId: character.id,
              data: { level: character.level }
            });
          }
          break;

        case 'item':
          if (reward.item) {
            // Check if item is stackable and already exists
            const existingItemIndex = character.inventory.items.findIndex((i: any) => i.id === reward.item.id);
            if (reward.item.stackable && existingItemIndex !== -1) {
              character.inventory.items[existingItemIndex].quantity += reward.amount;
            } else {
              // Add new item
              const newItem = { ...reward.item, quantity: reward.amount };
              character.inventory.items.push(newItem);
            }
            character.inventory.currentWeight += (reward.item.weight * reward.amount);

            // Log acquisition
            session.state.history.push({
              id: uuidv4(),
              type: 'item_acquired',
              timestamp: new Date().toISOString(),
              sourceId: character.id,
              data: { itemId: reward.item.id, itemName: reward.item.name, quantity: reward.amount }
            });
          }
          break;

        case 'gold':
          character.inventory.gold += reward.amount;
          // Log acquisition
          session.state.history.push({
            id: uuidv4(),
            type: 'gold_acquired',
            timestamp: new Date().toISOString(),
            sourceId: character.id,
            data: { amount: reward.amount }
          });
          break;
      }
    }

    // Persist changes
    const currentAttributes = character.attributes;
    const updatedAttributes = {
      nivel: character.level,
      experiencia: character.experience,
      vida: { actual: character.health.current, maxima: character.health.maximum },
      mana: { actual: character.mana.current, maxima: character.mana.maximum },
      estamina: { actual: character.stamina.current, maxima: character.stamina.maximum },
      fuerza: currentAttributes.strength,
      destreza: currentAttributes.dexterity,
      inteligencia: currentAttributes.intelligence,
      sabiduria: currentAttributes.wisdom,
      constitucion: currentAttributes.constitution,
      carisma: currentAttributes.charisma,
      suerte: currentAttributes.luck
    };

    await this.prisma.character.update({
      where: { id: character.id },
      data: {
        atributos: updatedAttributes
      }
    });
  }

  /**
   * Actualiza las métricas de comandos
   */
  private updateCommandMetrics(success: boolean, executionTime: number): void {
    this.metrics.totalCommandsExecuted++;

    // Actualizar tiempo promedio de ejecución
    const currentAvg = this.metrics.averageCommandExecutionTime;
    const newAvg = (currentAvg * (this.metrics.totalCommandsExecuted - 1) + executionTime) / this.metrics.totalCommandsExecuted;
    this.metrics.averageCommandExecutionTime = newAvg;

    // Actualizar tasa de error
    if (!success) {
      const totalCommands = this.metrics.totalCommandsExecuted;
      const currentErrors = this.metrics.errorRate * (totalCommands - 1);
      this.metrics.errorRate = (currentErrors + 1) / totalCommands;
    }
  }

  /**
   * Configura el auto-guardado
   */
  private setupAutoSave(): void {
    this.autoSaveTimer = setInterval(async () => {
      await this.autoSaveSessions();
    }, this.config.autoSaveInterval) as any;
  }

  /**
   * Configura la limpieza periódica
   */
  private setupPeriodicCleanup(): void {
    // Limpiar sesiones inactivas cada 30 minutos
    this.cleanupTimer = setInterval(async () => {
      if (!this.isShuttingDown) {
        await this.cleanupInactiveSessions();
      }
    }, 30 * 60 * 1000) as any;
  }

  /**
   * Configura la recolección de métricas
   */
  private setupMetricsCollection(): void {
    // Actualizar métricas cada 60 segundos
    this.metricsTimer = setInterval(async () => {
      try {
        await this.updateSystemMetrics();
      } catch (error) {
        this.logger.error('Error updating system metrics', { error });
      }
    }, 60_000) as any;
  }

  /**
   * Auto-guarda todas las sesiones activas
   */
  private async autoSaveSessions(): Promise<void> {
    if (this.isShuttingDown) {
      return; // No continuar si el motor se está apagando
    }

    const sessions = [...this.activeSessions.values()];

    for (const session of sessions) {
      if (session.settings.enableAutoSave) {
        try {
          await this.saveSessionToDatabase(session);
          await this.saveSessionToRedis(session);
        } catch (error) {
          this.logger.error(`Error auto-saving session ${session.sessionId}`, { error });
        }
      }
    }
  }

  /**
   * Limpia sesiones inactivas
   */
  private async cleanupInactiveSessions(): Promise<void> {
    const now = Date.now();
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutos

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const lastActivity = new Date(session.lastActivity).getTime();

      if (now - lastActivity > maxInactiveTime) {
        // Guardar antes de eliminar
        if (this.config.enablePersistence) {
          await this.saveSessionToDatabase(session);
        }

        // Eliminar de memoria
        this.activeSessions.delete(sessionId);

        // Eliminar de Redis
        if (this.config.enablePersistence) {
          await this.redis.del(`game:session:${sessionId}`);

          // Eliminar del índice de usuario
          const userSessionsKey = `game:user:${session.userId}:sessions`;
          await this.redis.srem(userSessionsKey, sessionId);
        }

        this.emit('session:cleanup', { sessionId, reason: 'inactive' });
      }
    }

    this.metrics.activeSessions = this.activeSessions.size;
  }

  /**
   * Actualiza las métricas del sistema
   */
  private async updateSystemMetrics(): Promise<void> {
    // Actualizar uso de memoria
    this.metrics.memoryUsage = process.memoryUsage().heapUsed;

    // Aquí se podrían agregar más métricas

    this.emit('metrics:updated', this.metrics);
  }

  /**
   * Obtiene las métricas actuales
   */
  getMetrics(): IGameEngineMetrics {
    return { ...this.metrics };
  }

  /**
   * Apaga el Game Engine de forma segura
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    // Detener timers
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      // @ts-ignore
      this.autoSaveTimer = undefined;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      // @ts-ignore
      this.cleanupTimer = undefined;
    }

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      // @ts-ignore
      this.metricsTimer = undefined;
    }

    // Guardar todas las sesiones activas
    if (this.config.enablePersistence) {
      await this.autoSaveSessions();
    }

    // Limpiar bloqueos expirados
    try {
      const cleanedLocks = await this.sessionLockManager.cleanupExpiredLocks();
      this.logger.info(`Cleaned up ${cleanedLocks} expired locks during shutdown`);
    } catch (error) {
      this.logger.error('Error cleaning up expired locks during shutdown', { error });
    }

    // Limpiar memoria
    this.activeSessions.clear();

    this.emit('engine:shutdown');
  }

  /**
   * Obtiene el SessionLockManager para operaciones avanzadas
   */
  getSessionLockManager(): ISessionLockManager {
    return this.sessionLockManager;
  }

  /**
   * Verifica si una sesión está bloqueada
   */
  async isSessionLocked(sessionId: UUID): Promise<boolean> {
    return this.sessionLockManager.isLocked(sessionId);
  }

  /**
   * Obtiene información del bloqueo de una sesión
   */
  async getSessionLockInfo(sessionId: UUID) {
    return this.sessionLockManager.getLockInfo(sessionId);
  }

  /**
   * Fuerza la liberación de un bloqueo de sesión (útil para administración)
   */
  async forceReleaseSessionLock(sessionId: UUID): Promise<void> {
    await this.sessionLockManager.forceRelease(sessionId);
  }

  /**
   * Obtiene el servicio de IA (si está habilitado)
   */
  getAIService(): IAIService | undefined {
    return this.aiService;
  }

  // Métodos auxiliares (implementaciones simplificadas)
  private getCurrentLocation(state: IGameState, character: ICharacter): any {
    if (!character.position || !character.position.mapId) return null;

    const locationEntity = state.entities[character.position.mapId];
    if (locationEntity && locationEntity.type === 'location') {
      return locationEntity.data;
    }
    return null;
  }

  private getPartyInfo(_state: IGameState): any {
    // Implementar lógica para obtener información del party
    return undefined;
  }
}