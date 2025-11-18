import { z } from "zod";
export declare const characterSheetSchema: z.ZodObject<{
    nombre: z.ZodString;
    raza: z.ZodString;
    clase: z.ZodString;
    atributos: z.ZodRecord<z.ZodString, z.ZodEnum<["Alta", "Media", "Baja"]>>;
    habilidades: z.ZodArray<z.ZodString, "many">;
    inventario: z.ZodArray<z.ZodString, "many">;
    estado: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nombre: string;
    raza: string;
    clase: string;
    atributos: Record<string, "Alta" | "Media" | "Baja">;
    habilidades: string[];
    inventario: string[];
    estado: string;
}, {
    nombre: string;
    raza: string;
    clase: string;
    atributos: Record<string, "Alta" | "Media" | "Baja">;
    habilidades: string[];
    inventario: string[];
    estado: string;
}>;
export type CharacterSheet = z.infer<typeof characterSheetSchema>;
export declare const characterSchema: z.ZodObject<{
    nombre: z.ZodString;
    raza: z.ZodString;
    clase: z.ZodString;
    atributos: z.ZodRecord<z.ZodString, z.ZodEnum<["Alta", "Media", "Baja"]>>;
    habilidades: z.ZodArray<z.ZodString, "many">;
    inventario: z.ZodArray<z.ZodString, "many">;
    estado: z.ZodString;
} & {
    id: z.ZodString;
    sessionId: z.ZodString;
    playerId: z.ZodString;
    seed: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    nombre: string;
    raza: string;
    clase: string;
    atributos: Record<string, "Alta" | "Media" | "Baja">;
    habilidades: string[];
    inventario: string[];
    estado: string;
    id: string;
    sessionId: string;
    playerId: string;
    seed: number;
    createdAt: string;
    updatedAt: string;
}, {
    nombre: string;
    raza: string;
    clase: string;
    atributos: Record<string, "Alta" | "Media" | "Baja">;
    habilidades: string[];
    inventario: string[];
    estado: string;
    id: string;
    sessionId: string;
    playerId: string;
    seed: number;
    createdAt: string;
    updatedAt: string;
}>;
export type Character = z.infer<typeof characterSchema>;
export declare const sessionSchema: z.ZodObject<{
    id: z.ZodString;
    ownerId: z.ZodString;
    title: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    seed: z.ZodNumber;
    currentTurn: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    characters: z.ZodArray<z.ZodObject<{
        nombre: z.ZodString;
        raza: z.ZodString;
        clase: z.ZodString;
        atributos: z.ZodRecord<z.ZodString, z.ZodEnum<["Alta", "Media", "Baja"]>>;
        habilidades: z.ZodArray<z.ZodString, "many">;
        inventario: z.ZodArray<z.ZodString, "many">;
        estado: z.ZodString;
    } & {
        id: z.ZodString;
        sessionId: z.ZodString;
        playerId: z.ZodString;
        seed: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        nombre: string;
        raza: string;
        clase: string;
        atributos: Record<string, "Alta" | "Media" | "Baja">;
        habilidades: string[];
        inventario: string[];
        estado: string;
        id: string;
        sessionId: string;
        playerId: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
    }, {
        nombre: string;
        raza: string;
        clase: string;
        atributos: Record<string, "Alta" | "Media" | "Baja">;
        habilidades: string[];
        inventario: string[];
        estado: string;
        id: string;
        sessionId: string;
        playerId: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    seed: number;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
    title: string;
    currentTurn: number;
    characters: {
        nombre: string;
        raza: string;
        clase: string;
        atributos: Record<string, "Alta" | "Media" | "Baja">;
        habilidades: string[];
        inventario: string[];
        estado: string;
        id: string;
        sessionId: string;
        playerId: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
    }[];
    summary?: string | undefined;
}, {
    id: string;
    seed: number;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
    title: string;
    currentTurn: number;
    characters: {
        nombre: string;
        raza: string;
        clase: string;
        atributos: Record<string, "Alta" | "Media" | "Baja">;
        habilidades: string[];
        inventario: string[];
        estado: string;
        id: string;
        sessionId: string;
        playerId: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
    }[];
    summary?: string | undefined;
}>;
export type Session = z.infer<typeof sessionSchema>;
export declare const sessionSummarySchema: z.ZodObject<Omit<{
    id: z.ZodString;
    ownerId: z.ZodString;
    title: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    seed: z.ZodNumber;
    currentTurn: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    characters: z.ZodArray<z.ZodObject<{
        nombre: z.ZodString;
        raza: z.ZodString;
        clase: z.ZodString;
        atributos: z.ZodRecord<z.ZodString, z.ZodEnum<["Alta", "Media", "Baja"]>>;
        habilidades: z.ZodArray<z.ZodString, "many">;
        inventario: z.ZodArray<z.ZodString, "many">;
        estado: z.ZodString;
    } & {
        id: z.ZodString;
        sessionId: z.ZodString;
        playerId: z.ZodString;
        seed: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        nombre: string;
        raza: string;
        clase: string;
        atributos: Record<string, "Alta" | "Media" | "Baja">;
        habilidades: string[];
        inventario: string[];
        estado: string;
        id: string;
        sessionId: string;
        playerId: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
    }, {
        nombre: string;
        raza: string;
        clase: string;
        atributos: Record<string, "Alta" | "Media" | "Baja">;
        habilidades: string[];
        inventario: string[];
        estado: string;
        id: string;
        sessionId: string;
        playerId: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
    }>, "many">;
}, "characters"> & {
    charactersCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    seed: number;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
    title: string;
    currentTurn: number;
    charactersCount: number;
    summary?: string | undefined;
}, {
    id: string;
    seed: number;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
    title: string;
    currentTurn: number;
    charactersCount: number;
    summary?: string | undefined;
}>;
export type SessionSummary = z.infer<typeof sessionSummarySchema>;
export declare const createSessionInputSchema: z.ZodObject<{
    ownerId: z.ZodString;
    title: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    seed: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    ownerId: string;
    title: string;
    seed?: number | undefined;
    summary?: string | undefined;
}, {
    ownerId: string;
    title: string;
    seed?: number | undefined;
    summary?: string | undefined;
}>;
export type CreateSessionInput = z.infer<typeof createSessionInputSchema>;
export declare const createSessionResponseSchema: z.ZodObject<{
    session: z.ZodObject<{
        id: z.ZodString;
        ownerId: z.ZodString;
        title: z.ZodString;
        summary: z.ZodOptional<z.ZodString>;
        seed: z.ZodNumber;
        currentTurn: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        characters: z.ZodArray<z.ZodObject<{
            nombre: z.ZodString;
            raza: z.ZodString;
            clase: z.ZodString;
            atributos: z.ZodRecord<z.ZodString, z.ZodEnum<["Alta", "Media", "Baja"]>>;
            habilidades: z.ZodArray<z.ZodString, "many">;
            inventario: z.ZodArray<z.ZodString, "many">;
            estado: z.ZodString;
        } & {
            id: z.ZodString;
            sessionId: z.ZodString;
            playerId: z.ZodString;
            seed: z.ZodNumber;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }, {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
        ownerId: string;
        title: string;
        currentTurn: number;
        characters: {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }[];
        summary?: string | undefined;
    }, {
        id: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
        ownerId: string;
        title: string;
        currentTurn: number;
        characters: {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }[];
        summary?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    session: {
        id: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
        ownerId: string;
        title: string;
        currentTurn: number;
        characters: {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }[];
        summary?: string | undefined;
    };
}, {
    session: {
        id: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
        ownerId: string;
        title: string;
        currentTurn: number;
        characters: {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }[];
        summary?: string | undefined;
    };
}>;
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;
export declare const listSessionsQuerySchema: z.ZodObject<{
    ownerId: z.ZodString;
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    ownerId: string;
    cursor?: string | undefined;
    limit?: number | undefined;
}, {
    ownerId: string;
    cursor?: string | undefined;
    limit?: number | undefined;
}>;
export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;
export declare const listSessionsResponseSchema: z.ZodObject<{
    sessions: z.ZodArray<z.ZodObject<Omit<{
        id: z.ZodString;
        ownerId: z.ZodString;
        title: z.ZodString;
        summary: z.ZodOptional<z.ZodString>;
        seed: z.ZodNumber;
        currentTurn: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        characters: z.ZodArray<z.ZodObject<{
            nombre: z.ZodString;
            raza: z.ZodString;
            clase: z.ZodString;
            atributos: z.ZodRecord<z.ZodString, z.ZodEnum<["Alta", "Media", "Baja"]>>;
            habilidades: z.ZodArray<z.ZodString, "many">;
            inventario: z.ZodArray<z.ZodString, "many">;
            estado: z.ZodString;
        } & {
            id: z.ZodString;
            sessionId: z.ZodString;
            playerId: z.ZodString;
            seed: z.ZodNumber;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }, {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }>, "many">;
    }, "characters"> & {
        charactersCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
        ownerId: string;
        title: string;
        currentTurn: number;
        charactersCount: number;
        summary?: string | undefined;
    }, {
        id: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
        ownerId: string;
        title: string;
        currentTurn: number;
        charactersCount: number;
        summary?: string | undefined;
    }>, "many">;
    nextCursor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sessions: {
        id: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
        ownerId: string;
        title: string;
        currentTurn: number;
        charactersCount: number;
        summary?: string | undefined;
    }[];
    nextCursor?: string | undefined;
}, {
    sessions: {
        id: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
        ownerId: string;
        title: string;
        currentTurn: number;
        charactersCount: number;
        summary?: string | undefined;
    }[];
    nextCursor?: string | undefined;
}>;
export type ListSessionsResponse = z.infer<typeof listSessionsResponseSchema>;
export declare const getSessionParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type GetSessionParams = z.infer<typeof getSessionParamsSchema>;
export declare const getSessionResponseSchema: z.ZodObject<{
    session: z.ZodObject<{
        id: z.ZodString;
        ownerId: z.ZodString;
        title: z.ZodString;
        summary: z.ZodOptional<z.ZodString>;
        seed: z.ZodNumber;
        currentTurn: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        characters: z.ZodArray<z.ZodObject<{
            nombre: z.ZodString;
            raza: z.ZodString;
            clase: z.ZodString;
            atributos: z.ZodRecord<z.ZodString, z.ZodEnum<["Alta", "Media", "Baja"]>>;
            habilidades: z.ZodArray<z.ZodString, "many">;
            inventario: z.ZodArray<z.ZodString, "many">;
            estado: z.ZodString;
        } & {
            id: z.ZodString;
            sessionId: z.ZodString;
            playerId: z.ZodString;
            seed: z.ZodNumber;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }, {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
        ownerId: string;
        title: string;
        currentTurn: number;
        characters: {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }[];
        summary?: string | undefined;
    }, {
        id: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
        ownerId: string;
        title: string;
        currentTurn: number;
        characters: {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }[];
        summary?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    session: {
        id: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
        ownerId: string;
        title: string;
        currentTurn: number;
        characters: {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }[];
        summary?: string | undefined;
    };
}, {
    session: {
        id: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
        ownerId: string;
        title: string;
        currentTurn: number;
        characters: {
            nombre: string;
            raza: string;
            clase: string;
            atributos: Record<string, "Alta" | "Media" | "Baja">;
            habilidades: string[];
            inventario: string[];
            estado: string;
            id: string;
            sessionId: string;
            playerId: string;
            seed: number;
            createdAt: string;
            updatedAt: string;
        }[];
        summary?: string | undefined;
    };
}>;
export type GetSessionResponse = z.infer<typeof getSessionResponseSchema>;
export declare const createCharacterInputSchema: z.ZodObject<{
    sessionId: z.ZodString;
    playerId: z.ZodString;
    prompt: z.ZodString;
    seed: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    playerId: string;
    prompt: string;
    seed?: number | undefined;
}, {
    sessionId: string;
    playerId: string;
    prompt: string;
    seed?: number | undefined;
}>;
export type CreateCharacterInput = z.infer<typeof createCharacterInputSchema>;
export declare const createCharacterResponseSchema: z.ZodObject<{
    character: z.ZodObject<{
        nombre: z.ZodString;
        raza: z.ZodString;
        clase: z.ZodString;
        atributos: z.ZodRecord<z.ZodString, z.ZodEnum<["Alta", "Media", "Baja"]>>;
        habilidades: z.ZodArray<z.ZodString, "many">;
        inventario: z.ZodArray<z.ZodString, "many">;
        estado: z.ZodString;
    } & {
        id: z.ZodString;
        sessionId: z.ZodString;
        playerId: z.ZodString;
        seed: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        nombre: string;
        raza: string;
        clase: string;
        atributos: Record<string, "Alta" | "Media" | "Baja">;
        habilidades: string[];
        inventario: string[];
        estado: string;
        id: string;
        sessionId: string;
        playerId: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
    }, {
        nombre: string;
        raza: string;
        clase: string;
        atributos: Record<string, "Alta" | "Media" | "Baja">;
        habilidades: string[];
        inventario: string[];
        estado: string;
        id: string;
        sessionId: string;
        playerId: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
    }>;
}, "strip", z.ZodTypeAny, {
    character: {
        nombre: string;
        raza: string;
        clase: string;
        atributos: Record<string, "Alta" | "Media" | "Baja">;
        habilidades: string[];
        inventario: string[];
        estado: string;
        id: string;
        sessionId: string;
        playerId: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
    };
}, {
    character: {
        nombre: string;
        raza: string;
        clase: string;
        atributos: Record<string, "Alta" | "Media" | "Baja">;
        habilidades: string[];
        inventario: string[];
        estado: string;
        id: string;
        sessionId: string;
        playerId: string;
        seed: number;
        createdAt: string;
        updatedAt: string;
    };
}>;
export type CreateCharacterResponse = z.infer<typeof createCharacterResponseSchema>;
//# sourceMappingURL=session.d.ts.map