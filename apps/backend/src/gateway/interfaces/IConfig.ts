export interface IRateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  draft_polli_ratelimit_headers?: boolean;
  onLimitReached?: (request: any, response: any, options: any) => void;
}

export interface ICircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  minimumNumberOfCalls: number;
  halfOpenMaxCalls: number;
  slowCallThreshold: number;
  slowCallRateThreshold: number;
  permittedNumberOfCallsInHalfOpenState: number;
  slidingWindowSize: number;
  slidingWindowType: 'COUNT_BASED' | 'TIME_BASED';
  waitDurationInOpenState: number;
  automaticTransitionFromOpenToHalfOpenEnabled: boolean;
}

export interface IServiceHealth {
  name: string;
  status: ServiceStatus;
  lastHealthCheck: Date;
  consecutiveFailures: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  circuitBreakerState: CircuitBreakerState;
  metadata?: Record<string, any>;
}

export interface IServiceConfig {
  name: string;
  url: string;
  timeout: number;
  retries: number;
  healthCheckPath: string;
  healthCheckInterval: number;
  circuitBreaker: ICircuitBreakerConfig;
  rateLimit: IRateLimitConfig;
  loadBalancing?: ILoadBalancingConfig;
  auth?: IServiceAuthConfig;
}

export interface ILoadBalancingConfig {
  strategy: LoadBalancingStrategy;
  servers: Array<string>;
  healthCheckEnabled: boolean;
  fallbackEnabled: boolean;
}

export interface IServiceAuthConfig {
  type: AuthType;
  credentials: Record<string, string>;
  tokenEndpoint?: string;
  refreshEnabled: boolean;
}

export interface IGatewayConfig {
  port: number;
  host: string;
  services: Array<IServiceConfig>;
  globalRateLimit: IRateLimitConfig;
  cors: ICorsConfig;
  security: ISecurityConfig;
  logging: ILoggingConfig;
  monitoring: IMonitoringConfig;
  redis: IRedisConfig;
}

export interface ICorsConfig {
  origin: string | Array<string> | boolean;
  methods: Array<string>;
  allowedHeaders: Array<string>;
  exposedHeaders: Array<string>;
  credentials: boolean;
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
}

export interface ISecurityConfig {
  helmet: boolean;
  hsts: boolean;
  noSniff: boolean;
  xssFilter: boolean;
  referrerPolicy: boolean;
  contentSecurityPolicy?: Record<string, any>;
  rateLimiting: boolean;
  apiKeyRequired: boolean;
  jwtSecret?: string;
  encryptionKey?: string;
}

export interface ILoggingConfig {
  level: LogLevel;
  format: LogFormat;
  destination: LogDestination;
  rotation: ILogRotation;
}

export interface IMonitoringConfig {
  enabled: boolean;
  metricsEndpoint: string;
  healthEndpoint: string;
  prometheusEnabled: boolean;
  jaegerEnabled: boolean;
  newRelicEnabled: boolean;
  datadogEnabled: boolean;
}

export interface ILogRotation {
  enabled: boolean;
  maxSize: string;
  maxFiles: number;
  compress: boolean;
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

export enum ServiceStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  DOWN = 'down',
  UNKNOWN = 'unknown'
}

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
  IP_HASH = 'ip_hash',
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  RANDOM = 'random'
}

export enum AuthType {
  NONE = 'none',
  API_KEY = 'api_key',
  JWT = 'jwt',
  OAUTH2 = 'oauth2',
  BASIC = 'basic'
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export enum LogFormat {
  JSON = 'json',
  PRETTY = 'pretty',
  COMBINED = 'combined',
  COMMON = 'common'
}

export enum LogDestination {
  CONSOLE = 'console',
  FILE = 'file',
  SYSLOG = 'syslog',
  DATADOG = 'datadog',
  NEWRELIC = 'newrelic'
}