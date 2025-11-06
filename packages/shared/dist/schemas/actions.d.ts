import { z } from "zod";
export declare const playerActionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    playerId: z.ZodString;
    action: z.ZodString;
    timestamp: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    playerId: string;
    action: string;
    timestamp?: number | undefined;
}, {
    sessionId: string;
    playerId: string;
    action: string;
    timestamp?: number | undefined;
}>;
export type PlayerAction = z.infer<typeof playerActionSchema>;
export declare const actionResolutionSchema: z.ZodObject<{
    narration: z.ZodString;
    stateChanges: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    imageTrigger: z.ZodOptional<z.ZodBoolean>;
    imagePrompt: z.ZodOptional<z.ZodString>;
    version: z.ZodLiteral<"1.0">;
}, "strip", z.ZodTypeAny, {
    narration: string;
    stateChanges: Record<string, unknown>;
    version: "1.0";
    imageTrigger?: boolean | undefined;
    imagePrompt?: string | undefined;
}, {
    narration: string;
    version: "1.0";
    stateChanges?: Record<string, unknown> | undefined;
    imageTrigger?: boolean | undefined;
    imagePrompt?: string | undefined;
}>;
export type ActionResolution = z.infer<typeof actionResolutionSchema>;
//# sourceMappingURL=actions.d.ts.map