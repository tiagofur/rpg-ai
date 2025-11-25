import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { AuthenticationService, ITokenPayload } from '../services/AuthenticationService.js';
import { UserRole, ErrorCode, IAuthUser } from '../types/index.js';

export interface AuthPluginOptions {
  jwtSecret: string;
  jwtRefreshSecret: string;
  redis: Redis;
  prisma: PrismaClient;
  bcryptRounds?: number;
  maxLoginAttempts?: number;
  lockoutDuration?: number;
  mfaIssuer?: string;
}

// Extender las interfaces de Fastify
declare module 'fastify' {
  interface FastifyRequest {
    user?: IAuthUser;
    tokenPayload?: ITokenPayload;
  }

  interface FastifyInstance {
    auth: AuthenticationService;
  }
}

// Middleware de autenticación
async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      reply.code(401).send({
        error: ErrorCode.UNAUTHORIZED,
        message: 'Authorization header required'
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      reply.code(401).send({
        error: ErrorCode.UNAUTHORIZED,
        message: 'Bearer token required'
      });
      return;
    }

    // Verificar token
    const payload = await request.server.auth.verifyToken(token);
    request.tokenPayload = payload;

    // Obtener usuario actualizado
    const user = await request.server.auth.userRepository.findById(payload.userId);
    if (!user) {
      reply.code(401).send({
        error: ErrorCode.UNAUTHORIZED,
        message: 'User not found'
      });
      return;
    }

    // Verificar estado de la cuenta
    if (user.status !== 'active') {
      reply.code(401).send({
        error: ErrorCode.ACCOUNT_SUSPENDED,
        message: 'Account is not active'
      });
      return;
    }

    request.user = user;
  } catch (error) {
    request.log.error(error, 'Authentication failed');
    reply.code(401).send({
      error: ErrorCode.UNAUTHORIZED,
      message: 'Invalid or expired token'
    });
  }
}

// Middleware de autorización por roles
function requireRole(minimumRole: UserRole) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.code(401).send({
        error: ErrorCode.UNAUTHORIZED,
        message: 'Authentication required'
      });
      return;
    }

    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.GUEST]: 0,
      [UserRole.USER]: 1,
      [UserRole.PREMIUM_USER]: 2,
      [UserRole.MODERATOR]: 3,
      [UserRole.ADMIN]: 4,
      [UserRole.SUPER_ADMIN]: 5
    };

    const userRoleLevel = roleHierarchy[request.user.role as UserRole];
    const requiredRoleLevel = roleHierarchy[minimumRole];

    if (userRoleLevel < requiredRoleLevel) {
      reply.code(403).send({
        error: ErrorCode.FORBIDDEN,
        message: 'Insufficient permissions'
      });
      
    }
  };
}

// Middleware de MFA
async function requireMFA(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.user) {
    reply.code(401).send({
      error: ErrorCode.UNAUTHORIZED,
      message: 'Authentication required'
    });
    return;
  }

  if (!request.user.mfaEnabled) {
    reply.code(403).send({
      error: ErrorCode.MFA_REQUIRED,
      message: 'Multi-factor authentication must be enabled'
    });
    
  }
}

export default fp(async (fastify: FastifyInstance, options: AuthPluginOptions) => {
  const {
    jwtSecret,
    jwtRefreshSecret,
    redis,
    prisma,
    bcryptRounds = 12,
    maxLoginAttempts = 5,
    lockoutDuration = 15 * 60 * 1000, // 15 minutos
    mfaIssuer = 'RPG AI Supreme'
  } = options;

  // Crear servicio de autenticación
  const authService = new AuthenticationService({
    jwtSecret,
    jwtRefreshSecret,
    redis,
    bcryptRounds,
    maxLoginAttempts,
    lockoutDuration,
    mfaIssuer
  }, prisma);

  // Decorar Fastify con el servicio de autenticación
  fastify.decorate('auth', authService);

  // Rutas de autenticación
  fastify.post('/api/auth/register', async (request, reply) => {
    try {
      const { email, username, password } = request.body as {
        email: string;
        username: string;
        password: string;
      };

      const user = await authService.register(email, username, password);

      reply.code(201).send({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status
        }
      });
    } catch (error) {
      request.log.error(error, 'Registration failed');

      if (error instanceof Error) {
        reply.code(400).send({
          error: ErrorCode.VALIDATION_ERROR,
          message: error.message
        });
      } else {
        reply.code(500).send({
          error: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Registration failed'
        });
      }
    }
  });

  fastify.post('/api/auth/login', async (request, reply) => {
    try {
      const { email, password, mfaToken, deviceId } = request.body as {
        email: string;
        password: string;
        mfaToken?: string;
        deviceId?: string;
      };

      const result = await authService.login(email, password, mfaToken, deviceId);

      if (result.requiresMFA) {
        reply.code(403).send({
          error: ErrorCode.MFA_REQUIRED,
          message: 'Multi-factor authentication required',
          requiresMFA: true
        });
        return;
      }

      reply.send({
        message: 'Login successful',
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          role: result.user.role,
          mfaEnabled: result.user.mfaEnabled
        },
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        }
      });
    } catch (error) {
      request.log.error(error, 'Login failed');

      if (error instanceof Error) {
        const errorMessage = error.message;

        if (errorMessage.includes('Invalid credentials')) {
          reply.code(401).send({
            error: ErrorCode.INVALID_CREDENTIALS,
            message: 'Invalid email or password'
          });
        } else if (errorMessage.includes('locked')) {
          reply.code(423).send({
            error: ErrorCode.ACCOUNT_SUSPENDED,
            message: errorMessage
          });
        } else {
          reply.code(401).send({
            error: ErrorCode.UNAUTHORIZED,
            message: errorMessage
          });
        }
      } else {
        reply.code(500).send({
          error: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Login failed'
        });
      }
    }
  });

  fastify.post('/api/auth/logout', { preHandler: authenticate }, async (request, reply) => {
    try {
      if (request.tokenPayload) {
        await authService.logout(request.tokenPayload.userId, request.tokenPayload.sessionId);
      }

      reply.send({
        message: 'Logout successful'
      });
    } catch (error) {
      request.log.error(error, 'Logout failed');
      reply.code(500).send({
        error: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Logout failed'
      });
    }
  });

  fastify.post('/api/auth/refresh', async (request, reply) => {
    try {
      const { refreshToken } = request.body as { refreshToken: string };

      const tokens = await authService.refreshToken(refreshToken);

      reply.send({
        message: 'Token refreshed successfully',
        tokens
      });
    } catch (error) {
      request.log.error(error, 'Token refresh failed');

      if (error instanceof Error && error.message.includes('expired')) {
        reply.code(401).send({
          error: ErrorCode.TOKEN_EXPIRED,
          message: 'Refresh token has expired'
        });
      } else {
        reply.code(401).send({
          error: ErrorCode.INVALID_TOKEN,
          message: 'Invalid refresh token'
        });
      }
    }
  });

  // Rutas MFA
  fastify.post('/api/auth/mfa/setup', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const setup = await authService.setupMFA(userId);

      reply.send({
        message: 'MFA setup initiated',
        setup
      });
    } catch (error) {
      request.log.error(error, 'MFA setup failed');
      reply.code(500).send({
        error: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'MFA setup failed'
      });
    }
  });

  fastify.post('/api/auth/mfa/enable', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const { token } = request.body as { token: string };

      await authService.enableMFA(userId, token);

      reply.send({
        message: 'MFA enabled successfully'
      });
    } catch (error) {
      request.log.error(error, 'MFA enable failed');

      if (error instanceof Error && error.message.includes('Invalid')) {
        reply.code(400).send({
          error: ErrorCode.INVALID_CREDENTIALS,
          message: 'Invalid MFA token'
        });
      } else {
        reply.code(500).send({
          error: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'MFA enable failed'
        });
      }
    }
  });

  fastify.post('/api/auth/mfa/disable', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const { password } = request.body as { password: string };

      await authService.disableMFA(userId, password);

      reply.send({
        message: 'MFA disabled successfully'
      });
    } catch (error) {
      request.log.error(error, 'MFA disable failed');

      if (error instanceof Error && error.message.includes('Invalid')) {
        reply.code(401).send({
          error: ErrorCode.INVALID_CREDENTIALS,
          message: 'Invalid password'
        });
      } else {
        reply.code(500).send({
          error: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'MFA disable failed'
        });
      }
    }
  });

  // Rutas protegidas de ejemplo
  fastify.get('/api/auth/profile', { preHandler: authenticate }, async (request, reply) => {
    reply.send({
      user: {
        id: request.user!.id,
        email: request.user!.email,
        username: request.user!.username,
        role: request.user!.role,
        status: request.user!.status,
        mfaEnabled: request.user!.mfaEnabled,
        lastLoginAt: request.user!.lastLoginAt
      }
    });
  });

  fastify.get('/api/admin/users', {
    preHandler: [authenticate, requireRole(UserRole.ADMIN)]
  }, async (_request, reply) => {
    reply.send({
      message: 'Admin access granted',
      users: [] // Aquí iría la lógica para obtener usuarios
    });
  });

}, {
  name: 'auth-plugin',
  dependencies: []
});

// Exportar middlewares para uso en otras rutas
export { authenticate, requireRole, requireMFA };