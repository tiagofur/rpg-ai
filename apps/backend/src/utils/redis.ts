import { Redis, type RedisOptions } from 'ioredis';
import { IRedisClient } from '../cache/interfaces/IRedisClient.js';

export class RedisClient extends Redis implements IRedisClient {
    constructor(options: RedisOptions) {
        super({
            ...options,
            lazyConnect: true,
            retryStrategy: (times: number) => {
                if (times > 3) {
                    console.warn('[Redis] Max retries reached, operating without Redis');
                    return null; // Stop retrying
                }
                return Math.min(times * 100, 2000);
            },
            maxRetriesPerRequest: 3,
        });

        this.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') {
                console.warn('[Redis] Connection refused - Redis is not running');
            }
        });
    }

    public isConnected(): boolean {
        return this.status === 'ready';
    }
}

/**
 * In-memory fallback for when Redis is not available.
 * Only for development - not suitable for production.
 */
export class InMemoryRedisClient implements IRedisClient {
    private store: Map<string, string> = new Map();
    private sets: Map<string, Set<string>> = new Map();
    private lists: Map<string, string[]> = new Map();
    private sortedSets: Map<string, Map<string, number>> = new Map();
    private expiries: Map<string, number> = new Map();
    private eventHandlers: Map<string | symbol, Array<(...args: unknown[]) => void>> = new Map();

    async get(key: string): Promise<string | null> {
        this.checkExpiry(key);
        return this.store.get(key) ?? null;
    }

    async set(key: string, value: string | number | Buffer, ...args: (string | number)[]): Promise<string | null> {
        const strValue = String(value);

        // Handle NX (only set if not exists)
        const nxIndex = args.indexOf('NX');
        if (nxIndex !== -1 && this.store.has(key)) {
            this.checkExpiry(key);
            if (this.store.has(key)) return null;
        }

        // Handle XX (only set if exists)
        const xxIndex = args.indexOf('XX');
        if (xxIndex !== -1) {
            this.checkExpiry(key);
            if (!this.store.has(key)) return null;
        }

        this.store.set(key, strValue);

        // Handle EX (seconds) expiry
        const exIndex = args.indexOf('EX');
        if (exIndex !== -1 && typeof args[exIndex + 1] === 'number') {
            this.expiries.set(key, Date.now() + (args[exIndex + 1] as number) * 1000);
        }

        // Handle PX (milliseconds) expiry
        const pxIndex = args.indexOf('PX');
        if (pxIndex !== -1 && typeof args[pxIndex + 1] === 'number') {
            this.expiries.set(key, Date.now() + (args[pxIndex + 1] as number));
        }

        return 'OK';
    }

    async del(...keys: string[]): Promise<number> {
        let deleted = 0;
        for (const key of keys) {
            if (this.store.delete(key)) deleted++;
            this.expiries.delete(key);
            this.sets.delete(key);
            this.lists.delete(key);
            this.sortedSets.delete(key);
        }
        return deleted;
    }

    async incr(key: string): Promise<number> {
        const val = parseInt(this.store.get(key) || '0', 10);
        const newVal = val + 1;
        this.store.set(key, String(newVal));
        return newVal;
    }

    async decr(key: string): Promise<number> {
        const val = parseInt(this.store.get(key) || '0', 10);
        const newVal = val - 1;
        this.store.set(key, String(newVal));
        return newVal;
    }

    async expire(key: string, seconds: number): Promise<number> {
        if (this.store.has(key) || this.sets.has(key) || this.lists.has(key)) {
            this.expiries.set(key, Date.now() + seconds * 1000);
            return 1;
        }
        return 0;
    }

    async setex(key: string, seconds: number, value: string): Promise<string> {
        this.store.set(key, value);
        this.expiries.set(key, Date.now() + seconds * 1000);
        return 'OK';
    }

    async ttl(key: string): Promise<number> {
        const expiry = this.expiries.get(key);
        if (!expiry) return -1;
        const remaining = Math.floor((expiry - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    }

    async exists(...keys: string[]): Promise<number> {
        return keys.filter(k => {
            this.checkExpiry(k);
            return this.store.has(k) || this.sets.has(k) || this.lists.has(k);
        }).length;
    }

    async keys(pattern: string): Promise<string[]> {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
        const allKeys = new Set([...this.store.keys(), ...this.sets.keys(), ...this.lists.keys()]);
        return [...allKeys].filter(k => {
            this.checkExpiry(k);
            return regex.test(k) && (this.store.has(k) || this.sets.has(k) || this.lists.has(k));
        });
    }

    async flushdb(): Promise<string> {
        this.store.clear();
        this.sets.clear();
        this.lists.clear();
        this.sortedSets.clear();
        this.expiries.clear();
        return 'OK';
    }

    // Set operations
    async sadd(key: string, ...members: string[]): Promise<number> {
        if (!this.sets.has(key)) this.sets.set(key, new Set());
        const set = this.sets.get(key)!;
        let added = 0;
        for (const member of members) {
            if (!set.has(member)) {
                set.add(member);
                added++;
            }
        }
        return added;
    }

    async srem(key: string, ...members: string[]): Promise<number> {
        const set = this.sets.get(key);
        if (!set) return 0;
        let removed = 0;
        for (const member of members) {
            if (set.delete(member)) removed++;
        }
        return removed;
    }

    async sismember(key: string, member: string): Promise<number> {
        return this.sets.get(key)?.has(member) ? 1 : 0;
    }

    async smembers(key: string): Promise<string[]> {
        return [...(this.sets.get(key) || [])];
    }

    // List operations
    async lpush(key: string, ...values: string[]): Promise<number> {
        if (!this.lists.has(key)) this.lists.set(key, []);
        const list = this.lists.get(key)!;
        list.unshift(...values.reverse());
        return list.length;
    }

    async lrange(key: string, start: number, stop: number): Promise<string[]> {
        const list = this.lists.get(key) || [];
        const end = stop < 0 ? list.length + stop + 1 : stop + 1;
        return list.slice(start, end);
    }

    async lset(key: string, index: number, value: string): Promise<string> {
        const list = this.lists.get(key);
        if (!list || index >= list.length) throw new Error('ERR index out of range');
        list[index] = value;
        return 'OK';
    }

    async ltrim(key: string, start: number, stop: number): Promise<string> {
        const list = this.lists.get(key);
        if (!list) return 'OK';
        const end = stop < 0 ? list.length + stop + 1 : stop + 1;
        this.lists.set(key, list.slice(start, end));
        return 'OK';
    }

    // Sorted set operations
    async zadd(key: string, score: number, member: string): Promise<number> {
        if (!this.sortedSets.has(key)) this.sortedSets.set(key, new Map());
        const zset = this.sortedSets.get(key)!;
        const existed = zset.has(member);
        zset.set(member, score);
        return existed ? 0 : 1;
    }

    async ping(): Promise<string> {
        return 'PONG';
    }

    async pexpire(key: string, milliseconds: number): Promise<number> {
        if (this.store.has(key) || this.sets.has(key) || this.lists.has(key)) {
            this.expiries.set(key, Date.now() + milliseconds);
            return 1;
        }
        return 0;
    }

    async pttl(key: string): Promise<number> {
        const expiry = this.expiries.get(key);
        if (!expiry) return -1;
        const remaining = expiry - Date.now();
        return remaining > 0 ? remaining : -2;
    }

    async incrby(key: string, increment: number): Promise<number> {
        const val = parseInt(this.store.get(key) || '0', 10);
        const newVal = val + increment;
        this.store.set(key, String(newVal));
        return newVal;
    }

    async info(section?: string): Promise<string> {
        return `# Memory
used_memory:1048576
used_memory_human:1.00M
maxmemory:0
maxmemory_human:0B
`;
    }

    // Pub/Sub (no-op for in-memory)
    async subscribe(..._args: (string | Buffer)[]): Promise<unknown> {
        return 0;
    }

    async unsubscribe(..._args: (string | Buffer)[]): Promise<unknown> {
        return 0;
    }

    async publish(_channel: string, _message: string): Promise<number> {
        return 0;
    }

    // Pipeline/Multi (simple implementation)
    pipeline(): any {
        return this.createChainable();
    }

    multi(): any {
        return this.createChainable();
    }

    private createChainable(): any {
        const commands: Array<() => Promise<unknown>> = [];
        const chainable = {
            get: (key: string) => { commands.push(() => this.get(key)); return chainable; },
            set: (key: string, value: string) => { commands.push(() => this.set(key, value)); return chainable; },
            del: (key: string) => { commands.push(() => this.del(key)); return chainable; },
            incr: (key: string) => { commands.push(() => this.incr(key)); return chainable; },
            exec: async () => Promise.all(commands.map(cmd => cmd().then(r => [null, r]).catch(e => [e, null]))),
        };
        return chainable;
    }

    // Event handling
    on(event: string | symbol, handler: (...args: unknown[]) => void): this {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)!.push(handler);
        return this;
    }

    off(event: string | symbol, handler: (...args: unknown[]) => void): this {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) handlers.splice(index, 1);
        }
        return this;
    }

    // Connection methods
    disconnect(): void {
        // No-op for in-memory
    }

    async connect(): Promise<void> {
        // No-op for in-memory
    }

    isConnected(): boolean {
        return true; // In-memory is always "connected"
    }

    private checkExpiry(key: string): void {
        const expiry = this.expiries.get(key);
        if (expiry && Date.now() > expiry) {
            this.store.delete(key);
            this.sets.delete(key);
            this.lists.delete(key);
            this.sortedSets.delete(key);
            this.expiries.delete(key);
        }
    }
}

/**
 * Create a Redis client, or fallback to in-memory if Redis is unavailable.
 */
export async function createRedisClient(options: RedisOptions): Promise<IRedisClient> {
    const redis = new RedisClient(options);

    try {
        await redis.connect();
        console.log('[Redis] Connected successfully');
        return redis;
    } catch (error) {
        console.warn('[Redis] Failed to connect, using in-memory fallback');
        redis.disconnect();
        return new InMemoryRedisClient();
    }
}
