import { createHash } from 'node:crypto';
import { Redis } from 'ioredis';
import { FastifyRequest } from 'fastify';
import { IApiGatewayConfig, IRateLimitConfig } from './ApiGateway.js';

// Rate limiting dinámico basado en roles
const getDynamicRateLimit = async (request: FastifyRequest): Promise<number> => {
  // Implementar lógica para determinar límite basado en:
  // - Rol del usuario (admin, premium, free)
  // - Plan de suscripción
  // - Historial de uso
  // - Comportamiento sospechoso

  const {user} = (request as any);

  if (!user) {
    return 10; // Límite para usuarios anónimos
  }

  switch (user.role) {
    case 'admin': {
      return 1000;
    } // Administradores
    case 'premium': {
      return 500;
    }  // Usuarios premium
    case 'verified': {
      return 100;
    }  // Usuarios verificados
    default: {
      return 50;
    }   // Usuarios estándar
  }
};

// Generador de claves inteligente
const intelligentKeyGenerator = async (request: FastifyRequest): Promise<string> => {
  const {user} = (request as any);
  const userAgent = request.headers['user-agent'] || 'unknown';
  const fingerprint = request.headers['x-fingerprint'] || request.ip;

  // Para usuarios autenticados, usar ID + fingerprint
  if (user?.id) {
    return `${user.id}:${fingerprint}`;
  }

  // Para usuarios anónimos, usar IP + user agent + fingerprint
  return `${request.ip}:${userAgent}:${fingerprint}`;
};

// Configuración de rate limiting por servicio
const serviceRateLimits: Record<string, IRateLimitConfig> = {
  auth: {
    windowMs: 60_000, // 1 minuto
    max: async (request: FastifyRequest) => {
      // Límites más estrictos para endpoints de auth
      if (request.url.includes('/login')) return 5;
      if (request.url.includes('/register')) return 3;
      if (request.url.includes('/reset-password')) return 3;
      return 20;
    },
    keyGenerator: intelligentKeyGenerator,
    errorMessage: 'Demasiados intentos de autenticación. Por favor, intenta más tarde.'
  },

  game: {
    windowMs: 60_000,
    max: getDynamicRateLimit,
    keyGenerator: intelligentKeyGenerator,
    skipSuccessfulRequests: true, // No contar requests exitosos
    errorMessage: 'Límite de acciones de juego excedido.'
  },

  ai: {
    windowMs: 60_000,
    max: async (request: FastifyRequest) => {
      // Límites específicos para AI
      const {user} = (request as any);
      if (user?.role === 'premium') return 100;
      if (user?.role === 'verified') return 30;
      return 10; // Usuarios gratuitos
    },
    keyGenerator: intelligentKeyGenerator,
    errorMessage: 'Límite de peticiones AI excedido.'
  },

  session: {
    windowMs: 60_000,
    max: 200,
    keyGenerator: intelligentKeyGenerator,
    errorMessage: 'Límite de gestión de sesiones excedido.'
  },

  analytics: {
    windowMs: 60_000,
    max: 1000,
    keyGenerator: intelligentKeyGenerator,
    errorMessage: 'Límite de analytics excedido.'
  }
};

// Configuración principal del API Gateway
export const apiGatewayConfig: IApiGatewayConfig = {
  redis: new Redis({
    host: process.env['REDIS_HOST'] || 'localhost',
    port: Number.parseInt(process.env['REDIS_PORT'] || '6379'),
    password: process.env['REDIS_PASSWORD'],
    db: Number.parseInt(process.env['REDIS_DB'] || '0'),
    maxRetriesPerRequest: 3,
    enableReadyCheck: true
  } as any),

  globalRateLimit: {
    windowMs: 60_000, // 1 minuto
    max: getDynamicRateLimit,
    keyGenerator: intelligentKeyGenerator,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    errorMessage: 'Demasiadas peticiones. Por favor, intenta más tarde.',
    onLimitReached: async (request, key) => {
      // Log de intentos de rate limiting
      console.warn(`Rate limit exceeded for key: ${key}`, {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        timestamp: new Date().toISOString()
      });

      // Aquí podrías implementar notificaciones, alertas, o bloqueos temporales
      // Por ejemplo, enviar a un sistema de SIEM o bloquear la IP temporalmente
    }
  },

  serviceRateLimits,

  circuitBreaker: {
    failureThreshold: 5,    // 5 fallos antes de abrir el circuito
    resetTimeout: 30_000,    // 30 segundos antes de intentar cerrar
    monitoringPeriod: 60_000 // 1 minuto de período de monitoreo
  }
};

// Configuración de seguridad adicional
export const securityConfig = {
  // Lista negra de IPs sospechosas
  blacklist: new Set([
    '192.168.1.100', // Ejemplo de IP bloqueada
  ]),

  // Patrones de URL sospechosos
  suspiciousPatterns: [
    /\/admin/i,
    /\/wp-admin/i,
    /\/phpmyadmin/i,
    /\.env$/,
    /\.git$/,
    /\/config/i
  ],

  // Límites por país (basado en IP)
  geoLimits: {
    'CN': 10,  // China: límite reducido
    'RU': 15,  // Rusia: límite reducido
    'US': 100, // USA: límite normal
    'EU': 80   // Europa: límite normal
  }
};

// Funciones de utilidad
export const isSuspiciousRequest = (request: FastifyRequest): boolean => {
  const {url} = request;
  const userAgent = request.headers['user-agent'] || '';

  // Verificar patrones sospechosos
  if (securityConfig.suspiciousPatterns.some(pattern => pattern.test(url))) {
    return true;
  }

  // Verificar user agents sospechosos
  const suspiciousUserAgents = [
    'sqlmap',
    'nikto',
    'burp',
    'zap',
    'acunetix'
  ];

  if (suspiciousUserAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return true;
  }

  return false;
};

export const getClientFingerprint = (request: FastifyRequest): string => {
  const {ip} = request;
  const userAgent = request.headers['user-agent'] || '';
  const acceptLanguage = request.headers['accept-language'] || '';
  const acceptEncoding = request.headers['accept-encoding'] || '';

  // Crear fingerprint único basado en headers
  const fingerprintData = `${ip}:${userAgent}:${acceptLanguage}:${acceptEncoding}`;
  return createHash('sha256').update(fingerprintData).digest('hex');
};