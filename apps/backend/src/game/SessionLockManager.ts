import { v4 as uuidv4 } from 'uuid';
import { GameError } from '../errors/GameError.js';
import { ErrorCode } from '../types/index.js';
import { ILogger } from '../logging/interfaces/ILogger.js';
import { IRedisClient } from '../cache/interfaces/IRedisClient.js';

export interface ISessionLock {
  sessionId: string;
  lockId: string;
  acquiredAt: Date;
  expiresAt: Date;
  owner: string; // userId or processId
}

export interface ISessionLockManager {
  acquireLock(sessionId: string, owner: string, timeoutMs?: number): Promise<ISessionLock>;
  releaseLock(sessionId: string, lockId: string): Promise<void>;
  isLocked(sessionId: string): Promise<boolean>;
  getLockInfo(sessionId: string): Promise<ISessionLock | null>;
  forceRelease(sessionId: string): Promise<void>;
  withSessionLock<T>(sessionId: string, owner: string, operation: () => Promise<T>, timeoutMs?: number): Promise<T>;
  cleanupExpiredLocks(): Promise<number>;
}

export class SessionLockManager implements ISessionLockManager {
  private readonly redis: IRedisClient;

  private readonly logger: ILogger;

  private readonly lockPrefix = 'session_lock:';

  private readonly lockTimeoutMs: number;

  constructor(redis: IRedisClient, logger: ILogger, options?: {
    defaultTimeoutMs?: number;
    lockTimeoutMs?: number;
  }) {
    this.redis = redis;
    this.logger = logger;
    // this._defaultTimeoutMs = options?.defaultTimeoutMs || 30000; // 30 seconds
    this.lockTimeoutMs = options?.lockTimeoutMs || 60_000; // 60 seconds default lock timeout
  }

  async acquireLock(sessionId: string, owner: string, timeoutMs?: number): Promise<ISessionLock> {
    const lockId = uuidv4();
    const lockKey = this.getLockKey(sessionId);
    const effectiveTimeout = timeoutMs || this.lockTimeoutMs;
    const expiresAt = new Date(Date.now() + effectiveTimeout);

    // Intentar adquirir el bloqueo con SET NX EX (atomic operation)
    const acquired = await this.redis.set(
      lockKey,
      JSON.stringify({
        lockId,
        owner,
        acquiredAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      }),
      'PX',
      effectiveTimeout,
      'NX'
    );

    if (!acquired) {
      // Verificar si el bloqueo existe y está expirado
      const existingLock = await this.getLockInfo(sessionId);
      if (existingLock && new Date() > new Date(existingLock.expiresAt)) {
        // El bloqueo está expirado, forzar liberación y reintentar
        await this.forceRelease(sessionId);
        return this.acquireLock(sessionId, owner, timeoutMs);
      }

      throw new GameError(
        `Session ${sessionId} is already locked by ${existingLock?.owner || 'unknown'}`,
        ErrorCode.SESSION_LOCKED,
        409,
        { sessionId, existingLock }
      );
    }

    const lock: ISessionLock = {
      sessionId,
      lockId,
      acquiredAt: new Date(),
      expiresAt,
      owner
    };

    this.logger.info('Lock acquired', { sessionId, lockId, owner });
    return lock;
  }

  async releaseLock(sessionId: string, lockId: string): Promise<void> {
    const lockKey = this.getLockKey(sessionId);

    // Verificar que el bloqueo existe y pertenece al lockId proporcionado
    const lockData = await this.redis.get(lockKey);
    if (!lockData) {
      this.logger.warn('Attempt to release non-existent lock', { sessionId, lockId });
      return;
    }

    try {
      const lock = JSON.parse(lockData);
      if (lock.lockId !== lockId) {
        throw new GameError(
          `Lock ID mismatch. Expected: ${lockId}, Found: ${lock.lockId}`,
          ErrorCode.SESSION_LOCK_MISMATCH,
          409,
          { sessionId, lockId, foundLockId: lock.lockId }
        );
      }

      // Liberar el bloqueo
      await this.redis.del(lockKey);
      this.logger.info('Lock released', { sessionId, lockId });
    } catch (error) {
      if (error instanceof GameError) {
        throw error;
      }
      throw new GameError(
        'Error releasing session lock',
        ErrorCode.SESSION_LOCK_ERROR,
        500,
        { sessionId, lockId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  async isLocked(sessionId: string): Promise<boolean> {
    const lockKey = this.getLockKey(sessionId);
    const exists = await this.redis.exists(lockKey);

    if (exists === 1) {
      // Verificar si el bloqueo está expirado
      const lockData = await this.redis.get(lockKey);
      if (lockData) {
        try {
          const lock = JSON.parse(lockData);
          const expiresAt = new Date(lock.expiresAt);
          if (new Date() > expiresAt) {
            // El bloqueo está expirado, liberarlo
            await this.forceRelease(sessionId);
            return false;
          }
          return true;
        } catch (error) {
          this.logger.error('Error checking lock expiration', { sessionId, error });
          return true; // Asumir bloqueado en caso de error
        }
      }
    }

    return false;
  }

  async getLockInfo(sessionId: string): Promise<ISessionLock | null> {
    const lockKey = this.getLockKey(sessionId);
    const lockData = await this.redis.get(lockKey);

    if (!lockData) {
      return null;
    }

    try {
      const lock = JSON.parse(lockData);
      return {
        sessionId,
        lockId: lock.lockId,
        owner: lock.owner,
        acquiredAt: new Date(lock.acquiredAt),
        expiresAt: new Date(lock.expiresAt)
      };
    } catch (error) {
      this.logger.error('Error parsing lock data', { sessionId, error });
      return null;
    }
  }

  async forceRelease(sessionId: string): Promise<void> {
    const lockKey = this.getLockKey(sessionId);
    const lockInfo = await this.getLockInfo(sessionId);

    await this.redis.del(lockKey);

    if (lockInfo) {
      this.logger.info('Lock forcefully released', {
        sessionId,
        lockId: lockInfo.lockId,
        owner: lockInfo.owner
      });
    } else {
      this.logger.info('No lock found to force release', { sessionId });
    }
  }

  private getLockKey(sessionId: string): string {
    return `${this.lockPrefix}${sessionId}`;
  }

  // Método auxiliar para ejecutar operaciones con bloqueo
  async withSessionLock<T>(
    sessionId: string,
    owner: string,
    operation: () => Promise<T>,
    timeoutMs?: number
  ): Promise<T> {
    let lock: ISessionLock | null = null;

    try {
      lock = await this.acquireLock(sessionId, owner, timeoutMs);
      const result = await operation();
      return result;
    } finally {
      if (lock) {
        try {
          await this.releaseLock(sessionId, lock.lockId);
        } catch (error) {
          this.logger.error('Error releasing lock in withSessionLock', {
            sessionId,
            lockId: lock?.lockId,
            error
          });
        }
      }
    }
  }

  // Método para limpiar bloqueos expirados (útil para mantenimiento)
  async cleanupExpiredLocks(): Promise<number> {
    const pattern = `${this.lockPrefix}*`;
    const keys = await this.redis.keys(pattern);
    let cleanedCount = 0;

    for (const key of keys) {
      try {
        const lockData = await this.redis.get(key);
        if (lockData) {
          const lock = JSON.parse(lockData);
          const expiresAt = new Date(lock.expiresAt);

          if (new Date() > expiresAt) {
            await this.redis.del(key);
            cleanedCount++;
            this.logger.info('Cleaned up expired lock', {
              sessionId: key.replace(this.lockPrefix, ''),
              lockId: lock.lockId
            });
          }
        }
      } catch (error) {
        this.logger.error('Error cleaning up lock', { key, error });
      }
    }

    this.logger.info('Expired locks cleanup completed', { cleanedCount, totalKeys: keys.length });
    return cleanedCount;
  }
}