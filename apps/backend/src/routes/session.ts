import { randomInt, randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  createSessionInputSchema,
  createSessionResponseSchema
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
}
