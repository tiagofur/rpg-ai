import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GuildService } from '../social/guild/GuildService.js';
import { authenticate } from '../plugins/auth.js';

import { IAuthUser } from '../types/index.js';

interface AuthenticatedRequest extends FastifyRequest {
    user: IAuthUser;
}

export interface GuildRoutesOptions {
    guildService: GuildService;
}

export async function guildRoutes(
    fastify: FastifyInstance,
    options: GuildRoutesOptions
) {
    const { guildService } = options;

    // Create Guild
    fastify.post('/guilds', {
        preHandler: authenticate,
        schema: {
            body: {
                type: 'object',
                required: ['name', 'tag'],
                properties: {
                    name: { type: 'string', minLength: 3, maxLength: 30 },
                    tag: { type: 'string', minLength: 2, maxLength: 5 },
                    description: { type: 'string', maxLength: 200 }
                }
            }
        }
    }, async (request: FastifyRequest, _reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const userId = req.user.id;
        const { name, tag, description } = request.body as { name: string; tag: string; description?: string };

        const guild = await guildService.createGuild({
            name,
            tag,
            description: description || '',
            ownerId: userId
        });
        return { success: true, data: guild };
    });

    // Get Guild
    fastify.get('/guilds/:id', {
        preHandler: authenticate,
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' }
                }
            }
        }
    }, async (request: FastifyRequest, _reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const guild = await guildService.getGuild(id);
        return { success: true, data: guild };
    });

    // Join Guild
    fastify.post('/guilds/:id/join', {
        preHandler: authenticate,
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' }
                }
            }
        }
    }, async (request: FastifyRequest, _reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const userId = req.user.id;
        const { id } = request.params as { id: string };

        const guild = await guildService.joinGuild(id, userId);
        return { success: true, data: guild };
    });

    // Leave Guild
    fastify.post('/guilds/:id/leave', {
        preHandler: authenticate,
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' }
                }
            }
        }
    }, async (request: FastifyRequest, _reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const userId = req.user.id;
        const { id } = request.params as { id: string };

        await guildService.leaveGuild(id, userId);
        return { success: true, message: 'Left guild successfully' };
    });

    // Disband Guild
    fastify.delete('/guilds/:id', {
        preHandler: authenticate,
        schema: {
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' }
                }
            }
        }
    }, async (request: FastifyRequest, _reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const userId = req.user.id;
        const { id } = request.params as { id: string };

        await guildService.disbandGuild(id, userId);
        return { success: true, message: 'Guild disbanded successfully' };
    });

    // Kick Member
    fastify.delete('/guilds/:id/members/:userId', {
        preHandler: authenticate,
        schema: {
            params: {
                type: 'object',
                required: ['id', 'userId'],
                properties: {
                    id: { type: 'string' },
                    userId: { type: 'string' }
                }
            }
        }
    }, async (request: FastifyRequest, _reply: FastifyReply) => {
        const req = request as AuthenticatedRequest;
        const ownerId = req.user.id;
        const { id, userId } = request.params as { id: string; userId: string };

        await guildService.kickMember(id, ownerId, userId);
        return { success: true, message: 'Member kicked successfully' };
    });

    // Search Guilds
    fastify.get('/guilds/search', {
        preHandler: authenticate,
        schema: {
            querystring: {
                type: 'object',
                required: ['q'],
                properties: {
                    q: { type: 'string', minLength: 1 }
                }
            }
        }
    }, async (request: FastifyRequest, _reply: FastifyReply) => {
        const { q } = request.query as { q: string };
        const guilds = await guildService.searchGuilds(q);
        return { success: true, data: guilds };
    });
}
