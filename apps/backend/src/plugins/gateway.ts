import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { ApiGateway } from '../gateway/ApiGateway.js';
import { apiGatewayConfig , securityConfig, isSuspiciousRequest } from '../gateway/config.js';


export interface GatewayPluginOptions {
  enableSecurity?: boolean;
  enableMetrics?: boolean;
  enableLogging?: boolean;
}

export default fp(async (fastify: FastifyInstance, options: GatewayPluginOptions = {}) => {
  const { enableSecurity = true, enableMetrics = true, enableLogging = true } = options;

  // Inicializar API Gateway
  const gateway = new ApiGateway(apiGatewayConfig);

  // Registrar el gateway con Fastify
  await gateway.register(fastify);

  // Middleware de seguridad
  if (enableSecurity) {
    fastify.addHook('onRequest', async (request, reply) => {
      // Verificar lista negra de IPs
      if (securityConfig.blacklist.has(request.ip)) {
        reply.code(403).send({
          error: 'BLOCKED_IP',
          message: 'Your IP address has been blocked'
        });
        return;
      }

      // Verificar requests sospechosos
      if (isSuspiciousRequest(request)) {
        reply.code(400).send({
          error: 'SUSPICIOUS_REQUEST',
          message: 'Request blocked due to suspicious activity'
        });
        return;
      }

      // Verificar headers requeridos
      const requiredHeaders = ['user-agent'];
      for (const header of requiredHeaders) {
        if (!request.headers[header]) {
          reply.code(400).send({
            error: 'MISSING_HEADER',
            message: `Required header missing: ${header}`
          });
          return;
        }
      }
    });
  }

  // Middleware de métricas
  if (enableMetrics) {
    fastify.addHook('onRequest', async (request) => {
      (request as any).startTime = Date.now();
      await gateway.incrementMetric('total_requests');
    });

    fastify.addHook('onResponse', async (request, reply) => {
      const responseTime = Date.now() - (request as any).startTime;
      await gateway.updateResponseTime(responseTime);

      // Registrar errores
      if (reply.statusCode >= 400) {
        await gateway.incrementMetric('error_requests');

        // Registrar fallos por servicio
        const serviceName = (request as any).url?.match(/^\/api\/([^/]+)/)?.[1];
        if (serviceName && reply.statusCode >= 500) {
          await gateway.recordServiceFailure(serviceName);
        }
      } else {
        // Registrar éxitos por servicio
        const serviceName = (request as any).url?.match(/^\/api\/([^/]+)/)?.[1];
        if (serviceName) {
          await gateway.recordServiceSuccess(serviceName);
        }
      }
    });
  }

  // Middleware de logging
  if (enableLogging) {
    fastify.addHook('onRequest', async (request) => {
      request.log.info({
        ip: request.ip,
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        timestamp: new Date().toISOString()
      }, 'Incoming request');
    });

    fastify.addHook('onResponse', async (request, reply) => {
      const responseTime = Date.now() - (request as any).startTime;
      request.log.info({
        ip: request.ip,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime,
        timestamp: new Date().toISOString()
      }, 'Request completed');
    });
  }

  // Decorar fastify con métodos del gateway
  fastify.decorate('gateway', gateway);

}, {
  name: 'api-gateway',
  dependencies: ['@fastify/rate-limit']
});