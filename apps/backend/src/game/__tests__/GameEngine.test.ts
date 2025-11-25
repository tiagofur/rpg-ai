import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine, IGameEngineConfig } from '../GameEngine.js';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { UUID } from '../interfaces.js';

// Mock de dependencias
vi.mock('ioredis');
vi.mock('@prisma/client');

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let mockRedis: Redis;
  let mockPrisma: PrismaClient;
  let config: IGameEngineConfig;

  beforeEach(() => {
    // Crear mocks
    mockRedis = {
      setex: vi.fn().mockResolvedValue('OK'),
      get: vi.fn().mockResolvedValue(null),
      del: vi.fn().mockResolvedValue(1),
      sadd: vi.fn().mockResolvedValue(1),
      srem: vi.fn().mockResolvedValue(1),
      set: vi.fn().mockResolvedValue('OK'),
    } as any;

    mockPrisma = {
      gameSession: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      character: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'test-character-id',
          nombre: 'Test Character',
          playerId: 'test-user-id',
          estado: 'active',
          atributos: JSON.stringify({
            vida: { actual: 100, maxima: 100 },
            mana: { actual: 50, maxima: 50 },
            estamina: { actual: 80, maxima: 80 },
            fuerza: 10,
            destreza: 10,
            inteligencia: 10,
            sabiduria: 10,
            constitucion: 10,
            carisma: 10,
            suerte: 10
          })
        }),
      },
    } as any;

    config = {
      redis: mockRedis,
      prisma: mockPrisma,
      maxUndoStackSize: 10,
      maxEventHistorySize: 100,
      autoSaveInterval: 5000,
      maxConcurrentSessions: 100,
      enableAI: false,
      enablePersistence: true,
      enableEventLogging: true,
      enableMetrics: true,
    };
  });

  afterEach(async () => {
    if (gameEngine) {
      await gameEngine.shutdown();
    }
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    it('debe crear una sesión válida', async () => {
      gameEngine = new GameEngine(config);

      const userId = 'test-user-id' as UUID;
      const characterId = 'test-character-id' as UUID;

      const session = await gameEngine.createSession(userId, characterId);

      expect(session).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(session.characterId).toBe(characterId);
      expect(session.isActive).toBe(true);
      expect(session.undoStack).toEqual([]);
      expect(session.redoStack).toEqual([]);
      expect(session.settings.difficulty).toBe('normal');
    });

    it('debe rechazar cuando se alcanza el límite de sesiones concurrentes', async () => {
      gameEngine = new GameEngine(config);

      // Crear sesiones hasta el límite
      config.maxConcurrentSessions = 1;
      const userId = 'test-user-id' as UUID;
      const characterId = 'test-character-id' as UUID;

      await gameEngine.createSession(userId, characterId);

      // Intentar crear otra sesión debe fallar
      await expect(
        gameEngine.createSession('another-user-id' as UUID, 'another-character-id' as UUID)
      ).rejects.toThrow('Maximum concurrent sessions reached');
    });
  });

  describe('executeCommand', () => {
    it('debe validar autorización del usuario', async () => {
      gameEngine = new GameEngine(config);

      const userId = 'test-user-id' as UUID;
      const characterId = 'test-character-id' as UUID;
      const session = await gameEngine.createSession(userId, characterId);

      // Intentar ejecutar comando con usuario diferente debe fallar
      await expect(
        gameEngine.executeCommand(session.sessionId, 'invalid-command', {}, 'different-user-id' as UUID)
      ).rejects.toThrow('User not authorized to execute commands in this session');
    });

    it('debe rechazar comando en sesión inexistente', async () => {
      gameEngine = new GameEngine(config);

      await expect(
        gameEngine.executeCommand('non-existent-session-id' as UUID, 'test-command')
      ).rejects.toThrow('Session not found');
    });
  });

  describe('memory management', () => {
    it('debe limpiar correctamente los timers en shutdown', async () => {
      gameEngine = new GameEngine(config);

      // Esperar a que se configuren los timers
      await new Promise(resolve => setTimeout(resolve, 100));

      await gameEngine.shutdown();

      // Verificar que se limpiaron las sesiones
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('debe sanitizar comandos antes de guardar en Redis', async () => {
      gameEngine = new GameEngine(config);

      const userId = 'test-user-id' as UUID;
      const characterId = 'test-character-id' as UUID;
      await gameEngine.createSession(userId, characterId);

      // Verificar que el mock de Redis fue llamado con datos sanitizados
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('game:session:'),
        3600,
        expect.stringContaining('"commandId"')
      );
    });
  });

  describe('cleanup', () => {
    it('debe limpiar sesiones inactivas correctamente', async () => {
      gameEngine = new GameEngine(config);

      const userId = 'test-user-id' as UUID;
      const characterId = 'test-character-id' as UUID;
      const session = await gameEngine.createSession(userId, characterId);

      // Simular sesión inactiva modificando la fecha de actividad
      // const inactiveSession = {
      //   ...session,
      //   lastActivity: new Date(Date.now() - 31 * 60 * 1000).toISOString() // 31 minutos atrás
      // };

      // Forzar la limpieza llamando al método directamente
      await (gameEngine as any).cleanupInactiveSessions();

      // Verificar que se eliminó de Redis
      expect(mockRedis.del).toHaveBeenCalledWith(`game:session:${session.sessionId}`);
      expect(mockRedis.srem).toHaveBeenCalledWith(`game:user:${userId}:sessions`, session.sessionId);
    });
  });

  describe('error handling', () => {
    it('debe manejar errores en timers sin crashear', async () => {
      gameEngine = new GameEngine(config);

      // Forzar un error en el auto-save
      (mockPrisma.gameSession.upsert as any).mockRejectedValueOnce(new Error('Database error'));

      const userId = 'test-user-id' as UUID;
      const characterId = 'test-character-id' as UUID;
      await gameEngine.createSession(userId, characterId);

      // Llamar al auto-save directamente para verificar manejo de errores
      await expect(
        (gameEngine as any).autoSaveSessions()
      ).resolves.not.toThrow();
    });
  });
});