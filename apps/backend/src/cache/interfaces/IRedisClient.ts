import { ChainableCommander } from 'ioredis';

export interface IRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string | number | Buffer, ttl?: number | string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<Array<string>>;
  flushdb(): Promise<string>;
  pipeline(): ChainableCommander;
  multi(): ChainableCommander;
  subscribe(...args: (string | Buffer)[]): Promise<unknown>;
  unsubscribe(...args: (string | Buffer)[]): Promise<unknown>;
  publish(channel: string, message: string): Promise<number>;
  on(event: string | symbol, handler: (...args: unknown[]) => void): this;
  off(event: string | symbol, handler: (...args: unknown[]) => void): this;
  disconnect(): void;
  connect(): Promise<void>;
  isConnected(): boolean;
  sadd(key: string, ...members: Array<string>): Promise<number>;
  srem(key: string, ...members: Array<string>): Promise<number>;
  sismember(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<Array<string>>;
  lpush(key: string, ...values: Array<string>): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<Array<string>>;
  lset(key: string, index: number, value: string): Promise<string>;
  ltrim(key: string, start: number, stop: number): Promise<string>;
  zadd(key: string, score: number, member: string): Promise<number>;
  ping(): Promise<string>;
  pexpire(key: string, milliseconds: number): Promise<number>;
  pttl(key: string): Promise<number>;
  incrby(key: string, increment: number): Promise<number>;
  info(section?: string): Promise<string>;
}

export interface ICacheClient {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  clear(): Promise<void>;
  size(): Promise<number>;
}

export interface ICacheConfig {
  defaultTTL: number;
  maxSize: number;
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
  namespace: string;
}

export interface IRedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  connectTimeout?: number;
  commandTimeout?: number;
  maxRetriesPerRequest?: number;
  enableOfflineQueue?: boolean;
  enableReadyCheck?: boolean;
}