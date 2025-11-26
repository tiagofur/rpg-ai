import { PrismaClient } from '@prisma/client';
import { GameEngine } from './GameEngine.js';
import { env } from '../env.js';
import { createRedisClient, InMemoryRedisClient } from '../utils/redis.js';
import type { IRedisClient } from '../cache/interfaces/IRedisClient.js';

export class GameService {
    private static instance: GameService;
    private static initPromise: Promise<GameService> | null = null;
    private engine: GameEngine;
    private prisma: PrismaClient;
    private redis: IRedisClient;

    private constructor(redis: IRedisClient) {
        this.prisma = new PrismaClient();
        this.redis = redis;

        this.engine = new GameEngine({
            redis: this.redis as any,
            prisma: this.prisma,
            maxUndoStackSize: 10,
            maxEventHistorySize: 50,
            autoSaveInterval: 60000, // 1 minute
            maxConcurrentSessions: 100,
            enableAI: true,
            enablePersistence: true,
            enableEventLogging: true,
            enableMetrics: true
        });
    }

    public static getInstance(): GameService {
        if (!GameService.instance) {
            // Create synchronously with in-memory fallback for now
            // The proper initialization should be done via initializeAsync
            console.warn('[GameService] Creating instance synchronously with in-memory Redis');
            GameService.instance = new GameService(new InMemoryRedisClient());
        }
        return GameService.instance;
    }

    public static async initializeAsync(): Promise<GameService> {
        if (GameService.instance) {
            return GameService.instance;
        }

        if (!GameService.initPromise) {
            GameService.initPromise = (async () => {
                const redis = await createRedisClient({
                    host: env.REDIS_HOST,
                    port: env.REDIS_PORT,
                    ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
                    db: env.REDIS_DB,
                });
                GameService.instance = new GameService(redis);
                return GameService.instance;
            })();
        }

        return GameService.initPromise;
    }

    public getEngine(): GameEngine {
        return this.engine;
    }

    public async shutdown(): Promise<void> {
        await this.engine.shutdown();
        await this.prisma.$disconnect();
        if ('disconnect' in this.redis && typeof this.redis.disconnect === 'function') {
            (this.redis as any).disconnect();
        }
    }
}
