import { randomInt, randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  createSessionInputSchema,
  createSessionResponseSchema,
  listSessionsQuerySchema,
  listSessionsResponseSchema
} from "../shared/index.js";

import { serializeSession } from "../utils/serializers.js";

const RNG_MAX = 2 ** 32;

export async function registerSessionRoutes(fastify: FastifyInstance) {
  fastify.post("/api/session/create", async (request, reply) => {
    const parsed = createSessionInputSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    try {
      const { ownerId, title, summary, seed } = parsed.data;
      const sessionId = randomUUID();
      const sessionSeed = seed ?? randomInt(RNG_MAX);

      const created = await fastify.prisma.gameSession.create({
        data: {
          id: sessionId,
          ownerId,
          title,
          summary: summary ?? null,
          seed: sessionSeed,
          currentTurn: 0
        },
        include: {
          characters: true
        }
      });

      const payload = createSessionResponseSchema.parse({
        session: serializeSession(created)
      });

      return await reply.status(201).send(payload);
    } catch (error) {
      request.log.error({ err: error }, "Failed to create session");
      return reply.status(500).send({ error: { message: "SESSION_CREATE_FAILED" } });
    }
  });

  // B-004: Endpoint para listar sesiones del usuario
  fastify.get("/api/session/list", async (request, reply) => {
    const parsed = listSessionsQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    try {
      const { ownerId, cursor, limit = 10 } = parsed.data;

      const sessions = await fastify.prisma.gameSession.findMany({
        where: {
          ownerId,
          ...(cursor ? { id: { lt: cursor } } : {})
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1, // Fetch one extra to determine if there's a next page
        include: {
          _count: { select: { characters: true } }
        }
      });

      // Determine if there's a next page
      const hasNextPage = sessions.length > limit;
      const resultSessions = hasNextPage ? sessions.slice(0, limit) : sessions;
      const nextCursor = hasNextPage ? resultSessions[resultSessions.length - 1]?.id : undefined;

      const payload = listSessionsResponseSchema.parse({
        sessions: resultSessions.map((s) => ({
          id: s.id,
          ownerId: s.ownerId,
          title: s.title,
          summary: s.summary,
          seed: s.seed,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          currentTurn: s.currentTurn,
          charactersCount: s._count.characters
        })),
        nextCursor
      });

      return await reply.status(200).send(payload);
    } catch (error) {
      request.log.error({ err: error }, "Failed to list sessions");
      return reply.status(500).send({ error: { message: "SESSION_LIST_FAILED" } });
    }
  });
}
