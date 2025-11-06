import type { Prisma } from "@prisma/client";
import type { Character, Session, SessionSummary } from "@rpg-ai/shared";

type AttributeLevel = Character["atributos"][string];

const ATTRIBUTE_LEVELS: AttributeLevel[] = ["Alta", "Media", "Baja"];

const isAttributeLevel = (value: unknown): value is AttributeLevel =>
  typeof value === "string" && ATTRIBUTE_LEVELS.includes(value as AttributeLevel);

export function serializeCharacter(character: PrismaCharacter): Character {
  const rawAtributos = (character.atributos ?? {}) as Record<string, unknown>;
  const atributos = Object.fromEntries(
    Object.entries(rawAtributos).map(([key, value]) => [
      key,
      isAttributeLevel(value) ? value : "Media"
    ])
  ) as Record<string, AttributeLevel>;

  return {
    id: character.id,
    sessionId: character.sessionId,
    playerId: character.playerId,
    nombre: character.nombre,
    raza: character.raza,
    clase: character.clase,
    atributos,
    habilidades: character.habilidades,
    inventario: character.inventario,
    estado: character.estado,
    seed: character.seed,
    createdAt: character.createdAt.toISOString(),
    updatedAt: character.updatedAt.toISOString()
  };
}

type SessionWithCharacters = Prisma.SessionGetPayload<{ include: { characters: true } }>;
type CharacterRecord = Prisma.CharacterGetPayload<{}>;

export function serializeSession(session: SessionWithCharacters): Session {
  return {
    id: session.id,
    ownerId: session.ownerId,
    title: session.title,
    summary: session.summary ?? undefined,
    seed: session.seed,
    currentTurn: session.currentTurn,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    characters: session.characters.map(serializeCharacter)
  };
}

export function serializeSessionSummary(
  session: SessionWithCharacters
): SessionSummary {
  return {
    id: session.id,
    ownerId: session.ownerId,
    title: session.title,
    summary: session.summary ?? undefined,
    seed: session.seed,
    currentTurn: session.currentTurn,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    charactersCount: session.characters.length
  };
}
