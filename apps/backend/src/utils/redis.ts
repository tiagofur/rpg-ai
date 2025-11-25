import { Redis, type RedisOptions } from 'ioredis';
import { IRedisClient } from '../cache/interfaces/IRedisClient.js';

export class RedisClient extends Redis implements IRedisClient {
    constructor(options: RedisOptions) {
        super(options);
    }

    public isConnected(): boolean {
        return this.status === 'ready';
    }
}
