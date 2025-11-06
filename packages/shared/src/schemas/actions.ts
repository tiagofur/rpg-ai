import { z } from "zod";

export const playerActionSchema = z.object({
  sessionId: z.string().uuid("sessionId must be a UUID"),
  playerId: z.string().uuid("playerId must be a UUID"),
  action: z.string().min(1, "action cannot be empty"),
  timestamp: z.number().int().nonnegative().optional()
});

export type PlayerAction = z.infer<typeof playerActionSchema>;

export const actionResolutionSchema = z.object({
  narration: z.string().min(1),
  stateChanges: z.record(z.string(), z.unknown()).default({}),
  imageTrigger: z.boolean().optional(),
  imagePrompt: z.string().optional(),
  version: z.literal("1.0")
});

export type ActionResolution = z.infer<typeof actionResolutionSchema>;
