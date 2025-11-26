import { z } from "zod";

const uuidSchema = z.string().uuid("Value must be a valid UUID");

const attributeLevelSchema = z.enum(["Alta", "Media", "Baja"], {
  required_error: "Debe especificar un nivel de atributo"
});

export const characterSheetSchema = z.object({
  nombre: z.string().min(1, "El nombre no puede estar vacío"),
  raza: z.string().min(1),
  clase: z.string().min(1),
  atributos: z.record(attributeLevelSchema),
  habilidades: z.array(z.string().min(1)),
  inventario: z.array(z.string().min(1)),
  estado: z.string().min(1)
});

export type CharacterSheet = z.infer<typeof characterSheetSchema>;

export const characterSchema = characterSheetSchema.extend({
  id: uuidSchema,
  sessionId: uuidSchema,
  playerId: uuidSchema,
  seed: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type Character = z.infer<typeof characterSchema>;

export const sessionSchema = z.object({
  id: uuidSchema,
  ownerId: uuidSchema,
  title: z.string().min(1),
  summary: z.string().optional(),
  seed: z.number().int().nonnegative(),
  currentTurn: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  characters: z.array(characterSchema)
});

export type Session = z.infer<typeof sessionSchema>;

export const sessionSummarySchema = sessionSchema
  .omit({ characters: true })
  .extend({
    charactersCount: z.number().int().nonnegative()
  });

export type SessionSummary = z.infer<typeof sessionSummarySchema>;

export const createSessionInputSchema = z.object({
  ownerId: uuidSchema,
  title: z.string().min(1),
  summary: z.string().optional(),
  seed: z.number().int().nonnegative().optional()
});

export type CreateSessionInput = z.infer<typeof createSessionInputSchema>;

export const createSessionResponseSchema = z.object({
  session: sessionSchema
});

export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;

export const listSessionsQuerySchema = z.object({
  ownerId: uuidSchema,
  cursor: uuidSchema.optional(),
  limit: z.coerce.number().int().positive().max(50).optional()
});

export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;

export const listSessionsResponseSchema = z.object({
  sessions: z.array(sessionSummarySchema),
  nextCursor: uuidSchema.optional()
});

export type ListSessionsResponse = z.infer<typeof listSessionsResponseSchema>;

export const getSessionParamsSchema = z.object({
  id: uuidSchema
});

export type GetSessionParams = z.infer<typeof getSessionParamsSchema>;

export const getSessionResponseSchema = z.object({
  session: sessionSchema
});

export type GetSessionResponse = z.infer<typeof getSessionResponseSchema>;

export const createCharacterInputSchema = z.object({
  sessionId: uuidSchema,
  playerId: uuidSchema,
  prompt: z.string().min(1),
  seed: z.number().int().nonnegative().optional()
});

export type CreateCharacterInput = z.infer<typeof createCharacterInputSchema>;

// Schema for direct character creation (player chooses all attributes)
export const createCharacterDirectInputSchema = z.object({
  sessionId: uuidSchema,
  playerId: uuidSchema,
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(30),
  raza: z.enum(["Humano", "Elfo", "Enano", "Mediano", "Tiefling", "Dracónido"]),
  clase: z.enum(["Guerrero", "Mago", "Pícaro", "Bardo", "Explorador", "Clérigo"]),
  atributos: z.object({
    Fuerza: z.number().int().min(8).max(18),
    Agilidad: z.number().int().min(8).max(18),
    Constitución: z.number().int().min(8).max(18),
    Inteligencia: z.number().int().min(8).max(18),
    Sabiduría: z.number().int().min(8).max(18),
    Carisma: z.number().int().min(8).max(18),
  }),
});

export type CreateCharacterDirectInput = z.infer<typeof createCharacterDirectInputSchema>;

// List characters for a user
export const listUserCharactersQuerySchema = z.object({
  playerId: uuidSchema.optional(), // If not provided, uses authenticated user
  cursor: uuidSchema.optional(),
  limit: z.coerce.number().int().positive().max(50).optional()
});

export type ListUserCharactersQuery = z.infer<typeof listUserCharactersQuerySchema>;

export const listUserCharactersResponseSchema = z.object({
  characters: z.array(characterSchema),
  nextCursor: uuidSchema.optional()
});

export type ListUserCharactersResponse = z.infer<typeof listUserCharactersResponseSchema>;

export const createCharacterResponseSchema = z.object({
  character: characterSchema
});

export type CreateCharacterResponse = z.infer<typeof createCharacterResponseSchema>;
