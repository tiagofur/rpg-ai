import { z } from 'zod';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { GameService } from '../game/GameService.js';
import { IGameSettings } from '../game/GameEngine.js';

const createSessionSchema = z.object({
    characterId: z.string().uuid(),
    settings: z.record(z.unknown()).optional()
});

const executeCommandSchema = z.object({
    type: z.string(),
    parameters: z.record(z.unknown()).optional()
});

export const registerGameRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const gameService = GameService.getInstance();
    const engine = gameService.getEngine();

    // Start/Initialize Game Session
    fastify.post('/api/game/:sessionId/start', async (request, reply) => {
        const { sessionId } = request.params as { sessionId: string };
        const userId = (request.headers['x-user-id'] as string) || 'system-user';

        const bodySchema = z.object({
            characterId: z.string().uuid(),
            settings: z.record(z.unknown()).optional()
        });

        try {
            const body = bodySchema.parse(request.body);

            // Try to get existing session
            let session = await engine.getSession(sessionId);

            // If session exists and has state, return it
            if (session && session.state) {
                return await reply.send(session);
            }

            // If session doesn't exist or has no state, initialize it
            // We pass the existing sessionId to link it to the DB record
            session = await engine.createSession(userId, body.characterId, body.settings as Partial<IGameSettings>, sessionId);
            return await reply.send(session);

        } catch (error) {
            request.log.error(error);
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            return reply.status(500).send({ error: 'Failed to start session' });
        }
    });

    // Create Session
    fastify.post('/api/game/session', async (request, reply) => {
        // TODO: Get userId from auth middleware
        // For now we assume the client sends it or we use a mock
        const userId = (request.headers['x-user-id'] as string) || 'system-user';

        try {
            const body = createSessionSchema.parse(request.body);
            const session = await engine.createSession(userId, body.characterId, body.settings as Partial<IGameSettings>);
            return await reply.send(session);
        } catch (error) {
            request.log.error(error);
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            return reply.status(500).send({ error: 'Failed to create session' });
        }
    });

    // Get Session
    fastify.get('/api/game/:sessionId', async (request, reply) => {
        const { sessionId } = request.params as { sessionId: string };

        try {
            const session = await engine.getSession(sessionId);
            if (!session) {
                return await reply.status(404).send({ error: 'Session not found' });
            }
            return await reply.send(session);
        } catch (error) {
            request.log.error(error);
            return reply.status(500).send({ error: 'Failed to get session' });
        }
    });

    // Execute Command
    fastify.post('/api/game/:sessionId/command', async (request, reply) => {
        const { sessionId } = request.params as { sessionId: string };
        const userId = (request.headers['x-user-id'] as string) || 'system-user';

        try {
            const body = executeCommandSchema.parse(request.body);
            const result = await engine.executeCommand(sessionId, body.type, body.parameters || {}, userId);
            return await reply.send(result);
        } catch (error) {
            request.log.error(error);
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            return reply.status(400).send({ error: error instanceof Error ? error.message : 'Command execution failed' });
        }
    });

    // Undo
    fastify.post('/api/game/:sessionId/undo', async (request, reply) => {
        const { sessionId } = request.params as { sessionId: string };
        const userId = (request.headers['x-user-id'] as string) || 'system-user';

        try {
            const result = await engine.undoCommand(sessionId, userId);
            return await reply.send(result);
        } catch (error) {
            return reply.status(400).send({ error: error instanceof Error ? error.message : 'Undo failed' });
        }
    });

    // Redo
    fastify.post('/api/game/:sessionId/redo', async (request, reply) => {
        const { sessionId } = request.params as { sessionId: string };
        const userId = (request.headers['x-user-id'] as string) || 'system-user';

        try {
            const result = await engine.redoCommand(sessionId, userId);
            return await reply.send(result);
        } catch (error) {
            return reply.status(400).send({ error: error instanceof Error ? error.message : 'Redo failed' });
        }
    });
};
