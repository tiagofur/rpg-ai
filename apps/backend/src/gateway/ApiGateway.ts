import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import { Redis } from 'ioredis';
import { createHash } from 'crypto';
import { promisify } from 'util';

export interface IRateLimitConfig {
  windowMs: number;
  max: number | ((req: FastifyRequest) => number | Promise<number>);
  keyGenerator?: (req: FastifyRequest) => string | Promise<string>;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  errorMessage?: string;
  onLimitReached?: (req: FastifyRequest, key: string) => void | Promise<void>;
}

export interface IApiGatewayConfig {
  redis: Redis;
  globalRateLimit: IRateLimitConfig;
  serviceRateLimits: Record<string, IRateLimitConfig>;
  circuitBreaker: {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
  };
}

export interface IServiceHealth {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  lastCheck: Date;
  failureCount: number;
  responseTime: number;
}

export class ApiGateway {
  private redis: Redis;
  private config: IApiGatewayConfig;
  private serviceHealth: Map<string, IServiceHealth> = new Map();
  private circuitBreakerStates: Map<string, 'closed' | 'open' | 'half-open'> = new Map();
  private failureCounts: Map<string, number> = new Map();
  private lastFailureTimes: Map<string, number> = new Map();

  constructor(config: IApiGatewayConfig) {
    this.config = config;
    this.redis = config.redis;
    this.initializeHealthMonitoring();
  }

  async register(fastify: FastifyInstance): Promise<void> {
    // Rate limiting global
    await fastify.register(fastifyRateLimit, {
      global: true,
      max: this.config.globalRateLimit.max,
      timeWindow: this.config.globalRateLimit.windowMs,
      keyGenerator: this.config.globalRateLimit.keyGenerator,
      skipSuccessfulRequests: this.config.globalRateLimit.skipSuccessfulRequests,
      skipFailedRequests: this.config.globalRateLimit.skipFailedRequests,
      errorResponseBuilder: (request, context) => ({
        error: 'RATE_LIMIT_EXCEEDED',
        message: this.config.globalRateLimit.errorMessage || 'Too many requests',
        retryAfter: Math.round(context.resetTime / 1000),
        limit: context.max,
        window: context.timeWindow
      }),
      redis: this.redis,
      continueExceeding: true,
      onLimitReached: this.config.globalRateLimit.onLimitReached
    });

    // Rate limiting por servicio
    for (const [serviceName, rateLimitConfig] of Object.entries(this.config.serviceRateLimits)) {
      fastify.addHook('onRequest', async (request, reply) => {
        if (request.url.startsWith(`/${serviceName}`)) {
          await this.enforceServiceRateLimit(request, reply, serviceName, rateLimitConfig);
        }
      });
    }

    // Circuit breaker middleware
    fastify.addHook('onRequest', async (request, reply) => {
      const serviceName = this.extractServiceName(request.url);
      if (serviceName && !await this.isServiceAvailable(serviceName)) {
        reply.code(503).send({
          error: 'SERVICE_UNAVAILABLE',
          message: `Service ${serviceName} is temporarily unavailable`,
          retryAfter: 30
        });
      }
    });

    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
      const healthStatus = await this.getHealthStatus();
      reply.code(healthStatus.status === 'healthy' ? 200 : 503).send(healthStatus);
    });

    // Metrics endpoint
    fastify.get('/metrics', async (request, reply) => {
      const metrics = await this.getMetrics();
      reply.send(metrics);
    });
  }

  private async enforceServiceRateLimit(
    request: FastifyRequest,
    reply: FastifyReply,
    serviceName: string,
    config: IRateLimitConfig
  ): Promise<void> {
    const key = await this.generateRateLimitKey(request, serviceName, config);
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.pexpire(key, config.windowMs);
    }

    const maxRequests = typeof config.max === 'function' ? await config.max(request) : config.max;

    if (current > maxRequests) {
      const ttl = await this.redis.pttl(key);
      reply.code(429).send({
        error: 'SERVICE_RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded for service ${serviceName}`,
        retryAfter: Math.round(ttl / 1000),
        service: serviceName,
        limit: maxRequests,
        window: config.windowMs
      });
    }
  }

  private async generateRateLimitKey(
    request: FastifyRequest,
    serviceName: string,
    config: IRateLimitConfig
  ): Promise<string> {
    const baseKey = config.keyGenerator ? await config.keyGenerator(request) : request.ip;
    const hashedKey = createHash('sha256').update(`${serviceName}:${baseKey}`).digest('hex');
    return `rate_limit:${serviceName}:${hashedKey}`;
  }

  private extractServiceName(url: string): string | null {
    const match = url.match(/^\/api\/([^\/]+)/);
    return match ? match[1] : null;
  }

  private async isServiceAvailable(serviceName: string): Promise<boolean> {
    const state = this.circuitBreakerStates.get(serviceName) || 'closed';
    const lastFailureTime = this.lastFailureTimes.get(serviceName) || 0;
    const currentTime = Date.now();

    if (state === 'open') {
      if (currentTime - lastFailureTime > this.config.circuitBreaker.resetTimeout) {
        this.circuitBreakerStates.set(serviceName, 'half-open');
        return true;
      }
      return false;
    }

    return state !== 'open';
  }

  async recordServiceFailure(serviceName: string): Promise<void> {
    const currentTime = Date.now();
    this.lastFailureTimes.set(serviceName, currentTime);

    const currentCount = this.failureCounts.get(serviceName) || 0;
    const newCount = currentCount + 1;
    this.failureCounts.set(serviceName, newCount);

    if (newCount >= this.config.circuitBreaker.failureThreshold) {
      this.circuitBreakerStates.set(serviceName, 'open');
      this.failureCounts.set(serviceName, 0);
    }
  }

  async recordServiceSuccess(serviceName: string): Promise<void> {
    const state = this.circuitBreakerStates.get(serviceName);
    if (state === 'half-open') {
      this.circuitBreakerStates.set(serviceName, 'closed');
      this.failureCounts.set(serviceName, 0);
    }
  }

  private initializeHealthMonitoring(): void {
    setInterval(async () => {
      await this.checkServiceHealth();
    }, 30000); // Check cada 30 segundos
  }

  private async checkServiceHealth(): Promise<void> {
    const services = ['auth', 'game', 'ai', 'session', 'analytics'];

    for (const service of services) {
      try {
        const startTime = Date.now();
        // Implementar lógica de health check específica por servicio
        const isHealthy = await this.performHealthCheck(service);
        const responseTime = Date.now() - startTime;

        this.serviceHealth.set(service, {
          service,
          status: isHealthy ? 'healthy' : 'unhealthy',
          lastCheck: new Date(),
          failureCount: isHealthy ? 0 : (this.serviceHealth.get(service)?.failureCount || 0) + 1,
          responseTime
        });
      } catch (error) {
        this.serviceHealth.set(service, {
          service,
          status: 'unhealthy',
          lastCheck: new Date(),
          failureCount: (this.serviceHealth.get(service)?.failureCount || 0) + 1,
          responseTime: -1
        });
      }
    }
  }

  private async performHealthCheck(service: string): Promise<boolean> {
    // Implementar health checks específicos para cada servicio
    try {
      switch (service) {
        case 'auth':
          return await this.checkAuthServiceHealth();
        case 'game':
          return await this.checkGameServiceHealth();
        case 'ai':
          return await this.checkAIServiceHealth();
        case 'session':
          return await this.checkSessionServiceHealth();
        case 'analytics':
          return await this.checkAnalyticsServiceHealth();
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  }

  private async checkAuthServiceHealth(): Promise<boolean> {
    // Verificar conexión a base de datos de autenticación
    return true; // Implementar lógica específica
  }

  private async checkGameServiceHealth(): Promise<boolean> {
    // Verificar estado del motor de juego
    return true; // Implementar lógica específica
  }

  private async checkAIServiceHealth(): Promise<boolean> {
    // Verificar disponibilidad de proveedores AI
    return true; // Implementar lógica específica
  }

  private async checkSessionServiceHealth(): Promise<boolean> {
    // Verificar gestión de sesiones
    return true; // Implementar lógica específica
  }

  private async checkAnalyticsServiceHealth(): Promise<boolean> {
    // Verificar sistema de analytics
    return true; // Implementar lógica específica
  }

  private async getHealthStatus(): Promise<any> {
    const services = Array.from(this.serviceHealth.values());
    const overallStatus = services.every(s => s.status === 'healthy') ? 'healthy' :
      services.some(s => s.status === 'unhealthy') ? 'unhealthy' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: services,
      uptime: process.uptime()
    };
  }

  private async getMetrics(): Promise<any> {
    const totalRequests = await this.redis.get('metrics:total_requests') || '0';
    const avgResponseTime = await this.redis.get('metrics:avg_response_time') || '0';
    const errorRate = await this.redis.get('metrics:error_rate') || '0';

    return {
      totalRequests: parseInt(totalRequests),
      avgResponseTime: parseFloat(avgResponseTime),
      errorRate: parseFloat(errorRate),
      timestamp: new Date().toISOString(),
      services: Array.from(this.serviceHealth.values())
    };
  }

  async incrementMetric(metric: string, value: number = 1): Promise<void> {
    await this.redis.incrby(`metrics:${metric}`, value);
  }

  async updateResponseTime(responseTime: number): Promise<void> {
    const key = 'metrics:avg_response_time';
    const current = await this.redis.get(key) || '0';
    const count = await this.redis.get('metrics:total_requests') || '1';

    const newAvg = (parseFloat(current) * parseInt(count) + responseTime) / (parseInt(count) + 1);
    await this.redis.set(key, newAvg.toString());
  }
}