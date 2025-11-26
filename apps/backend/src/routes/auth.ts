import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthenticationService } from '../services/AuthenticationService.js';

const registerSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3),
    password: z.string().min(8),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    deviceId: z.string().optional(),
});

const refreshSchema = z.object({
    refreshToken: z.string(),
});

export async function registerAuthRoutes(fastify: FastifyInstance, options: { authService: AuthenticationService }) {
    const { authService } = options;

    fastify.post('/api/auth/register', async (request, reply) => {
        const parsed = registerSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten() });
        }

        try {
            const { email, username, password } = parsed.data;
            const user = await authService.register(email, username, password);
            return await reply.status(201).send({ user: { id: user.id, email: user.email, username: user.username } });
        } catch (error) {
            request.log.error(error);
            return reply.status(400).send({ error: error instanceof Error ? error.message : 'Registration failed' });
        }
    });

    fastify.post('/api/auth/login', async (request, reply) => {
        const parsed = loginSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten() });
        }

        try {
            const { email, password, deviceId } = parsed.data;
            const result = await authService.login(email, password, undefined, deviceId);
            return await reply.send(result);
        } catch (error) {
            request.log.error(error);
            return reply.status(401).send({ error: 'Invalid credentials' });
        }
    });

    fastify.post('/api/auth/refresh', async (request, reply) => {
        const parsed = refreshSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten() });
        }

        try {
            const { refreshToken } = parsed.data;
            const result = await authService.refreshToken(refreshToken);
            return await reply.send(result);
        } catch (error) {
            request.log.error(error);
            return reply.status(401).send({ error: 'Invalid refresh token' });
        }
    });

    fastify.get('/api/auth/me', async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.status(401).send({ error: 'No token provided' });
            }

            const token = authHeader.substring(7);

            // Verificar el token y obtener el payload
            const jwt = await import('jsonwebtoken');
            const payload = jwt.verify(token, process.env['JWT_SECRET'] || 'your-secret-key') as { userId: string };

            // Buscar el usuario en la base de datos
            const user = await request.server.prisma.user.findUnique({
                where: { id: payload.userId },
                select: { id: true, email: true, username: true }
            });

            if (!user) {
                return reply.status(401).send({ error: 'Invalid token' });
            }

            return await reply.send({ user });
        } catch (error) {
            request.log.error(error);
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    fastify.post('/api/auth/logout', async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.status(401).send({ error: 'No token provided' });
            }

            const token = authHeader.substring(7);

            // Verificar el token y obtener el sessionId
            const jwt = await import('jsonwebtoken');
            const payload = jwt.verify(token, process.env['JWT_SECRET'] || 'your-secret-key') as { userId: string; sessionId: string };

            await authService.logout(payload.userId, payload.sessionId);

            return await reply.send({ message: 'Logged out successfully' });
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Logout failed' });
        }
    });
}