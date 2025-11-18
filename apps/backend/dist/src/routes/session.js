import { randomInt, randomUUID } from "node:crypto";
import { createSessionInputSchema, createSessionResponseSchema } from "@rpg-ai/shared";
import { serializeSession } from "../utils/serializers";
const RNG_MAX = 2 ** 32;
export async function registerSessionRoutes(fastify) {
    fastify.post("/api/session/create", async (request, reply) => {
        const parsed = createSessionInputSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten() });
        }
        try {
            const { ownerId, title, summary, seed } = parsed.data;
            const sessionId = randomUUID();
            const sessionSeed = seed ?? randomInt(RNG_MAX);
            const created = await fastify.prisma.session.create({
                data: {
                    id: sessionId,
                    ownerId,
                    title,
                    summary,
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
            return reply.status(201).send(payload);
        }
        catch (error) {
            request.log.error({ err: error }, "Failed to create session");
            return reply.status(500).send({ error: { message: "SESSION_CREATE_FAILED" } });
        }
    });
}
