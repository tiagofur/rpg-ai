import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import { Redis } from 'ioredis';
import { createHash } from 'node:crypto';

export interface IRateLimitConfig {
  windowMs: number;
  max: number | ((request: FastifyRequest) => number | Promise<number>);
  keyGenerator?: (request: FastifyRequest) => string | Promise<string>;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  errorMessage?: string;
  onLimitReached?: (request: FastifyRequest, key: string) => void | Promise<void>;
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
  private readonly redis: Redis;

  private readonly config: IApiGatewayConfig;

  private readonly serviceHealth: Map<string, IServiceHealth> = new Map();

  private readonly circuitBreakerStates: Map<string, 'closed' | 'open' | 'half-open'> = new Map();

  private readonly failureCounts: Map<string, number> = new Map();

  private readonly lastFailureTimes: Map<string, number> = new Map();

  private readonly fallbackMetrics: Map<string, number | Array<number>> = new Map(); // Para métricas cuando Redis falla

  constructor(config: IApiGatewayConfig) {
    this.config = config;
    this.redis = config.redis;
    this.validateRedisConnection(); // Agregar validación de conexión
    this.initializeHealthMonitoring();
  }

  private async validateRedisConnection(): Promise<void> {
    try {
      // Verificar conexión inicial a Redis
      await this.redis.ping();
      console.log('✅ Redis connection validated successfully');
    } catch (error) {
      console.error('❌ Redis connection validation failed:', error);
      throw new Error(`Failed to connect to Redis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async register(fastify: FastifyInstance): Promise<void> {
    // Rate limiting global
    await fastify.register(fastifyRateLimit, {
      global: true,
      max: this.config.globalRateLimit.max as any,
      timeWindow: this.config.globalRateLimit.windowMs,
      keyGenerator: this.config.globalRateLimit.keyGenerator,
      // skipSuccessfulRequests: this.config.globalRateLimit.skipSuccessfulRequests,
      // skipFailedRequests: this.config.globalRateLimit.skipFailedRequests,
      errorResponseBuilder: (_request: any, context: any) => ({
        error: 'RATE_LIMIT_EXCEEDED',
        message: this.config.globalRateLimit.errorMessage || 'Too many requests',
        retryAfter: Math.round(context.ttl / 1000),
        limit: context.max,
        window: this.config.globalRateLimit.windowMs
      }),
      redis: this.redis,
      continueExceeding: true,
      // onLimitReached: this.config.globalRateLimit.onLimitReached
    } as any);

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
    fastify.get('/health', async (_request, reply) => {
      const healthStatus = await this.getHealthStatus();
      reply.code(healthStatus.status === 'healthy' ? 200 : 503).send(healthStatus);
    });

    // Metrics endpoint
    fastify.get('/metrics', async (_request, reply) => {
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
    try {
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
    } catch (error) {
      console.error(`Rate limiting error for service ${serviceName}:`, error);
      // En caso de error con Redis, permitir el request pero loggear el error
      // Esto evita bloquear usuarios por problemas de infraestructura
      console.warn(`Rate limiting disabled for service ${serviceName} due to Redis error`);
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
    const match = url.match(/^\/api\/([^/]+)/);
    return match && match[1] ? match[1] : null;
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

    return true;
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

      // Intentar sincronizar métricas de fallback cada 5 minutos
      if (Math.floor(Date.now() / 1000) % 300 === 0) { // Cada 5 minutos
        await this.syncFallbackMetrics();
      }
    }, 30_000); // Check cada 30 segundos
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
      } catch {
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
        case 'auth': {
          return await this.checkAuthServiceHealth();
        }
        case 'game': {
          return await this.checkGameServiceHealth();
        }
        case 'ai': {
          return await this.checkAIServiceHealth();
        }
        case 'session': {
          return await this.checkSessionServiceHealth();
        }
        case 'analytics': {
          return await this.checkAnalyticsServiceHealth();
        }
        default: {
          return true;
        }
      }
    } catch {
      return false;
    }
  }

  private async checkAuthServiceHealth(): Promise<boolean> {
    try {
      // Verificar conexión a Redis (usado para sesiones y rate limiting)
      const redisStart = Date.now();
      await this.redis.ping();
      const redisLatency = Date.now() - redisStart;

      // Verificar que Redis responda en menos de 1 segundo
      if (redisLatency > 1000) {
        console.warn(`Auth service health check: Redis latency ${redisLatency}ms exceeds threshold`);
        return false;
      }

      // Verificar que podemos leer/escribir en Redis
      const testKey = `health:auth:${Date.now()}`;
      await this.redis.setex(testKey, 5, 'health-check');
      const testValue = await this.redis.get(testKey);
      await this.redis.del(testKey);

      if (testValue !== 'health-check') {
        console.error('Auth service health check: Redis read/write test failed');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Auth service health check failed:', error);
      return false;
    }
  }

  private async checkGameServiceHealth(): Promise<boolean> {
    try {
      // Verificar disponibilidad de memoria para el motor de juego
      const memUsage = process.memoryUsage();
      const memoryLimitMB = 512; // Límite de 512MB para el servicio de juego
      const currentMemoryMB = memUsage.heapUsed / 1024 / 1024;

      if (currentMemoryMB > memoryLimitMB) {
        console.warn(`Game service health check: Memory usage ${currentMemoryMB.toFixed(2)}MB exceeds limit ${memoryLimitMB}MB`);
        return false;
      }

      // Verificar que Redis esté disponible para gestión de sesiones de juego
      const redisStart = Date.now();
      await this.redis.keys('game:session:*');
      const redisLatency = Date.now() - redisStart;

      if (redisLatency > 2000) {
        console.warn(`Game service health check: Redis query latency ${redisLatency}ms exceeds threshold`);
        return false;
      }

      // Verificar que haya espacio en Redis (menos de 1GB usado)
      const redisInfo = await this.redis.info('memory');
      const usedMemoryMatch = redisInfo.match(/used_memory:(\d+)/);
      const usedMemoryMB = usedMemoryMatch && usedMemoryMatch[1] ? Number.parseInt(usedMemoryMatch[1]) / 1024 / 1024 : 0;

      if (usedMemoryMB > 1024) {
        console.warn(`Game service health check: Redis memory usage ${usedMemoryMB.toFixed(2)}MB exceeds threshold`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Game service health check failed:', error);
      return false;
    }
  }

  private async checkAIServiceHealth(): Promise<boolean> {
    try {
      // Verificar que haya espacio suficiente en caché de Redis para respuestas de IA
      const redisInfo = await this.redis.info('memory');
      const maxMemoryMatch = redisInfo.match(/maxmemory:(\d+)/);
      const usedMemoryMatch = redisInfo.match(/used_memory:(\d+)/);

      if (maxMemoryMatch && usedMemoryMatch && maxMemoryMatch[1] && usedMemoryMatch[1]) {
        const maxMemory = Number.parseInt(maxMemoryMatch[1]);
        const usedMemory = Number.parseInt(usedMemoryMatch[1]);

        if (maxMemory > 0 && usedMemory > maxMemory * 0.9) {
          console.warn(`AI service health check: Redis memory usage exceeds 90% threshold`);
          return false;
        }
      }

      // Verificar que podamos hacer operaciones de caché (importante para IA)
      const aiCacheStart = Date.now();
      const testKey = `health:ai:${Date.now()}`;
      const testData = JSON.stringify({ test: 'ai-cache', timestamp: Date.now() });

      await this.redis.setex(testKey, 10, testData);
      const cachedData = await this.redis.get(testKey);
      await this.redis.del(testKey);

      const cacheLatency = Date.now() - aiCacheStart;

      if (cacheLatency > 1500) {
        console.warn(`AI service health check: Cache operation latency ${cacheLatency}ms exceeds threshold`);
        return false;
      }

      if (!cachedData || cachedData !== testData) {
        console.error('AI service health check: Cache read/write test failed');
        return false;
      }

      // Verificar cantidad de operaciones de IA en caché (si hay demasiadas, podría indicar problema)
      const aiKeys = await this.redis.keys('ai:*');
      if (aiKeys.length > 10_000) {
        console.warn(`AI service health check: Excessive AI cache entries (${aiKeys.length}) detected`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  }

  private async checkSessionServiceHealth(): Promise<boolean> {
    try {
      // Verificar que Redis pueda manejar operaciones de sesión
      const sessionStart = Date.now();
      const testSessionId = `health:session:${Date.now()}`;
      const testSessionData = {
        userId: 'health-check-user',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3_600_000).toISOString() // 1 hora
      };

      // Probar escritura de sesión
      await this.redis.setex(testSessionId, 3600, JSON.stringify(testSessionData));

      // Probar lectura de sesión
      const retrievedSession = await this.redis.get(testSessionId);
      await this.redis.del(testSessionId);

      const sessionLatency = Date.now() - sessionStart;

      if (sessionLatency > 1000) {
        console.warn(`Session service health check: Session operation latency ${sessionLatency}ms exceeds threshold`);
        return false;
      }

      if (!retrievedSession) {
        console.error('Session service health check: Session read/write test failed');
        return false;
      }

      // Verificar que podamos parsear la sesión
      try {
        const parsedSession = JSON.parse(retrievedSession);
        if (parsedSession.userId !== testSessionData.userId) {
          console.error('Session service health check: Session data integrity test failed');
          return false;
        }
      } catch (parseError) {
        console.error('Session service health check: Session data parsing failed', parseError);
        return false;
      }

      // Verificar cantidad de sesiones activas (si hay demasiadas, podría indicar problema)
      const sessionKeys = await this.redis.keys('session:*');
      if (sessionKeys.length > 50_000) {
        console.warn(`Session service health check: Excessive active sessions (${sessionKeys.length}) detected`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session service health check failed:', error);
      return false;
    }
  }

  private async checkAnalyticsServiceHealth(): Promise<boolean> {
    try {
      // Verificar que podamos escribir métricas (operación crítica para analytics)
      const metricsStart = Date.now();
      const testMetricKey = `health:analytics:${Date.now()}`;
      const testMetricValue = JSON.stringify({
        timestamp: new Date().toISOString(),
        value: Math.random(),
        service: 'health-check'
      });

      // Probar escritura de métrica
      await this.redis.setex(testMetricKey, 60, testMetricValue); // TTL de 1 minuto

      // Probar lectura de métrica
      const retrievedMetric = await this.redis.get(testMetricKey);
      await this.redis.del(testMetricKey);

      const metricsLatency = Date.now() - metricsStart;

      if (metricsLatency > 1500) {
        console.warn(`Analytics service health check: Metrics operation latency ${metricsLatency}ms exceeds threshold`);
        return false;
      }

      if (!retrievedMetric) {
        console.error('Analytics service health check: Metrics read/write test failed');
        return false;
      }

      // Verificar que podemos hacer operaciones de contador (usado para analytics)
      const counterKey = `health:analytics:counter:${Date.now()}`;
      await this.redis.incr(counterKey);
      const counterValue = await this.redis.get(counterKey);
      await this.redis.del(counterKey);

      if (counterValue !== '1') {
        console.error('Analytics service health check: Counter operation test failed');
        return false;
      }

      // Verificar cantidad de claves de métricas (si hay demasiadas, podría indicar problema de limpieza)
      const metricKeys = await this.redis.keys('metrics:*');
      if (metricKeys.length > 100_000) {
        console.warn(`Analytics service health check: Excessive metric entries (${metricKeys.length}) detected`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Analytics service health check failed:', error);
      return false;
    }
  }

  private async getHealthStatus(): Promise<any> {
    const services = [...this.serviceHealth.values()];
    const overallStatus = services.every(s => s.status === 'healthy') ? 'healthy' :
      services.some(s => s.status === 'unhealthy') ? 'unhealthy' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services,
      uptime: process.uptime()
    };
  }

  private async getMetrics(): Promise<any> {
    const totalRequests = await this.redis.get('metrics:total_requests') || '0';
    const avgResponseTime = await this.redis.get('metrics:avg_response_time') || '0';
    const errorRate = await this.redis.get('metrics:error_rate') || '0';

    return {
      totalRequests: Number.parseInt(totalRequests),
      avgResponseTime: Number.parseFloat(avgResponseTime),
      errorRate: Number.parseFloat(errorRate),
      timestamp: new Date().toISOString(),
      services: [...this.serviceHealth.values()]
    };
  }

  async incrementMetric(metric: string, value: number = 1): Promise<void> {
    try {
      await this.redis.incrby(`metrics:${metric}`, value);
    } catch (error) {
      console.error(`Failed to increment metric ${metric}:`, error);
      // Fallback: almacenar en memoria temporalmente
      const fallbackKey = `fallback:${metric}`;
      const currentFallback = (this.fallbackMetrics.get(fallbackKey) as number) || 0;
      this.fallbackMetrics.set(fallbackKey, currentFallback + value);
    }
  }

  async updateResponseTime(responseTime: number): Promise<void> {
    try {
      const key = 'metrics:avg_response_time';
      const current = await this.redis.get(key) || '0';
      const count = await this.redis.get('metrics:total_requests') || '1';

      const newAvg = (Number.parseFloat(current) * Number.parseInt(count) + responseTime) / (Number.parseInt(count) + 1);
      await this.redis.set(key, newAvg.toString());
    } catch (error) {
      console.error('Failed to update response time metric:', error);
      // Fallback: almacenar temporalmente en memoria
      const fallbackKey = 'fallback:response_times';
      const currentTimes = (this.fallbackMetrics.get(fallbackKey) as Array<number>) || [];
      currentTimes.push(responseTime);
      this.fallbackMetrics.set(fallbackKey, currentTimes);
    }
  }

  async syncFallbackMetrics(): Promise<void> {
    try {
      // Sincronizar métricas de fallback con Redis
      for (const [key, value] of this.fallbackMetrics.entries()) {
        if (key.startsWith('fallback:')) {
          const realKey = key.replace('fallback:', '');

          if (realKey === 'response_times' && Array.isArray(value)) {
            // Promediar los tiempos de respuesta fallbacks
            const avgTime = value.reduce((a, b) => a + b, 0) / value.length;
            await this.redis.set('metrics:avg_response_time', avgTime.toString());
          } else if (typeof value === 'number') {
            // Métricas de contador
            await this.redis.incrby(`metrics:${realKey}`, value);
          }

          // Limpiar fallback después de sincronizar
          this.fallbackMetrics.delete(key);
        }
      }

      console.log('✅ Fallback metrics synchronized successfully');
    } catch (error) {
      console.error('Failed to sync fallback metrics:', error);
    }
  }
}