import { randomInt, randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  createCharacterInputSchema,
  createCharacterResponseSchema
} from "../shared/index.js";

import { generateCharacterSheet } from "../services/CharacterGenerator.js";
import { serializeCharacter } from "../utils/serializers.js";

const RNG_MAX = 2 ** 32;

export async function registerCharacterRoutes(fastify: FastifyInstance) {
  fastify.post("/api/character/create", async (request, reply) => {
    const parsed = createCharacterInputSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { sessionId, playerId, prompt, seed } = parsed.data;

    try {
      const session = await fastify.prisma.gameSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        return await reply.status(404).send({ error: { message: "SESSION_NOT_FOUND" } });
      }

      const characterSeed = seed ?? randomInt(RNG_MAX);
      const sheet = generateCharacterSheet(prompt, characterSeed);

      const created = await fastify.prisma.character.create({
        data: {
          id: randomUUID(),
          sessionId,
          playerId,
          seed: characterSeed,
          nombre: sheet.nombre,
          raza: sheet.raza,
          clase: sheet.clase,
          atributos: sheet.atributos,
          habilidades: sheet.habilidades,
          inventario: sheet.inventario,
          estado: sheet.estado
        }
      });

      const payload = createCharacterResponseSchema.parse({
        character: serializeCharacter(created)
      });

      return await reply.status(201).send(payload);
    } catch (error) {
      request.log.error({ err: error }, "Failed to create character");
      return reply.status(500).send({ error: { message: "CHARACTER_CREATE_FAILED" } });
    }
  });

  fastify.get("/api/character/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const character = await fastify.prisma.character.findUnique({
        where: { id }
      });

      if (!character) {
        return await reply.status(404).send({ error: { message: "CHARACTER_NOT_FOUND" } });
      }

      return await reply.send({ character: serializeCharacter(character) });
    } catch (error) {
      request.log.error({ err: error }, "Failed to get character");
      return reply.status(500).send({ error: { message: "CHARACTER_GET_FAILED" } });
    }
  });
}
