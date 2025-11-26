import { randomInt, randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  createCharacterInputSchema,
  createCharacterDirectInputSchema,
  createCharacterResponseSchema,
  listUserCharactersResponseSchema
} from "../shared/index.js";

import { generateCharacterSheet, generateSkillsForClass, generateInventoryForClass } from "../services/CharacterGenerator.js";
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

  // Direct character creation - player chooses all attributes
  fastify.post("/api/character/create-direct", async (request, reply) => {
    const parsed = createCharacterDirectInputSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { sessionId, playerId, nombre, raza, clase, atributos } = parsed.data;

    try {
      const session = await fastify.prisma.gameSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        return await reply.status(404).send({ error: { message: "SESSION_NOT_FOUND" } });
      }

      // Generate seed for future randomness
      const characterSeed = randomInt(RNG_MAX);

      // Convert numeric attributes to string levels for storage
      const atributosNivel: Record<string, string> = {};
      for (const [key, value] of Object.entries(atributos)) {
        if (value >= 15) atributosNivel[key] = "Alta";
        else if (value >= 12) atributosNivel[key] = "Media";
        else atributosNivel[key] = "Baja";
      }

      // Generate skills and inventory based on class
      const habilidades = generateSkillsForClass(clase, characterSeed);
      const inventario = generateInventoryForClass(clase, characterSeed);

      const created = await fastify.prisma.character.create({
        data: {
          id: randomUUID(),
          sessionId,
          playerId,
          seed: characterSeed,
          nombre,
          raza,
          clase,
          atributos: atributosNivel,
          habilidades,
          inventario,
          estado: "Saludable"
        }
      });

      const payload = createCharacterResponseSchema.parse({
        character: serializeCharacter(created)
      });

      return await reply.status(201).send(payload);
    } catch (error) {
      request.log.error({ err: error }, "Failed to create character directly");
      return reply.status(500).send({ error: { message: "CHARACTER_CREATE_FAILED" } });
    }
  });

  // List characters for current authenticated user
  fastify.get("/api/character/my", async (request, reply) => {
    try {
      // Get user from JWT token
      const user = request.user as { id: string } | undefined;

      if (!user?.id) {
        return await reply.status(401).send({ error: { message: "UNAUTHORIZED" } });
      }

      const characters = await fastify.prisma.character.findMany({
        where: { playerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50
      });

      const payload = listUserCharactersResponseSchema.parse({
        characters: characters.map(serializeCharacter)
      });

      return await reply.send(payload);
    } catch (error) {
      request.log.error({ err: error }, "Failed to list user characters");
      return reply.status(500).send({ error: { message: "CHARACTER_LIST_FAILED" } });
    }
  });

  // List characters for a specific session
  fastify.get("/api/session/:sessionId/characters", async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    try {
      const session = await fastify.prisma.gameSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        return await reply.status(404).send({ error: { message: "SESSION_NOT_FOUND" } });
      }

      const characters = await fastify.prisma.character.findMany({
        where: { sessionId },
        orderBy: { createdAt: "desc" }
      });

      const payload = listUserCharactersResponseSchema.parse({
        characters: characters.map(serializeCharacter)
      });

      return await reply.send(payload);
    } catch (error) {
      request.log.error({ err: error }, "Failed to list session characters");
      return reply.status(500).send({ error: { message: "CHARACTER_LIST_FAILED" } });
    }
  });

  // Delete a character
  fastify.delete("/api/character/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const user = request.user as { id: string } | undefined;

      if (!user?.id) {
        return await reply.status(401).send({ error: { message: "UNAUTHORIZED" } });
      }

      const character = await fastify.prisma.character.findUnique({
        where: { id }
      });

      if (!character) {
        return await reply.status(404).send({ error: { message: "CHARACTER_NOT_FOUND" } });
      }

      // Only allow deleting own characters
      if (character.playerId !== user.id) {
        return await reply.status(403).send({ error: { message: "FORBIDDEN" } });
      }

      await fastify.prisma.character.delete({
        where: { id }
      });

      return await reply.status(204).send();
    } catch (error) {
      request.log.error({ err: error }, "Failed to delete character");
      return reply.status(500).send({ error: { message: "CHARACTER_DELETE_FAILED" } });
    }
  });
}
