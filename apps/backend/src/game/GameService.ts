import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { GameEngine } from './GameEngine.js';
import { env } from '../env.js';

export class GameService {
    private static instance: GameService;
    private engine: GameEngine;
    private prisma: PrismaClient;
    private redis: Redis;

    private constructor() {
        this.prisma = new PrismaClient();
        this.redis = new Redis(env.REDIS_URL);

        this.engine = new GameEngine({
            redis: this.redis,
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
            GameService.instance = new GameService();
        }
        return GameService.instance;
    }

    public getEngine(): GameEngine {
        return this.engine;
    }

    public async shutdown(): Promise<void> {
        await this.engine.shutdown();
        await this.prisma.$disconnect();
        this.redis.disconnect();
    }
}
