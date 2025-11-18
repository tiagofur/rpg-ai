export interface IRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushdb(): Promise<void>;
  pipeline(): IRedisPipeline;
  multi(): IRedisMulti;
  subscribe(channels: string[]): Promise<void>;
  unsubscribe(channels: string[]): Promise<void>;
  publish(channel: string, message: string): Promise<number>;
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
  disconnect(): Promise<void>;
  connect(): Promise<void>;
  isConnected(): boolean;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  sismember(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  lpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  lset(key: string, index: number, value: string): Promise<void>;
}

export interface IRedisPipeline {
  get(key: string): IRedisPipeline;
  set(key: string, value: string): IRedisPipeline;
  del(key: string): IRedisPipeline;
  incr(key: string): IRedisPipeline;
  expire(key: string, seconds: number): IRedisPipeline;
  exec(): Promise<any[]>;
}

export interface IRedisMulti {
  get(key: string): IRedisMulti;
  set(key: string, value: string): IRedisMulti;
  del(key: string): IRedisMulti;
  incr(key: string): IRedisMulti;
  expire(key: string, seconds: number): IRedisMulti;
  exec(): Promise<any[]>;
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