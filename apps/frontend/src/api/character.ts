import { client } from './client';

// ============================================================================
// Types
// ============================================================================

export interface CharacterAttributes {
    Fuerza: string;
    Agilidad: string;
    Constitución: string;
    Inteligencia: string;
    Sabiduría: string;
    Carisma: string;
}

export interface NumericAttributes {
    Fuerza: number;
    Agilidad: number;
    Constitución: number;
    Inteligencia: number;
    Sabiduría: number;
    Carisma: number;
}

export interface Character {
    id: string;
    sessionId: string;
    playerId: string;
    seed: number;
    nombre: string;
    raza: string;
    clase: string;
    atributos: CharacterAttributes;
    habilidades: string[];
    inventario: string[];
    estado: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCharacterInput {
    sessionId: string;
    playerId: string;
    prompt: string;
    seed?: number;
}

// Input for direct character creation (player chooses everything)
export interface CreateCharacterDirectInput {
    sessionId: string;
    playerId: string;
    nombre: string;
    raza: 'Humano' | 'Elfo' | 'Enano' | 'Mediano' | 'Tiefling' | 'Dracónido';
    clase: 'Guerrero' | 'Mago' | 'Pícaro' | 'Bardo' | 'Explorador' | 'Clérigo';
    atributos: NumericAttributes;
}

export interface CreateCharacterResponse {
    character: Character;
}

export interface GetCharacterResponse {
    character: Character;
}

export interface ListCharactersResponse {
    characters: Character[];
}

// ============================================================================
// API Functions
// ============================================================================

export const characterApi = {
    /**
     * Create a new character with AI generation (uses prompt)
     */
    create: async (input: CreateCharacterInput): Promise<CreateCharacterResponse> => {
        const { data } = await client.post<CreateCharacterResponse>(
            '/api/character/create',
            input
        );
        return data;
    },

    /**
     * Create a new character with direct input (player chooses all attributes)
     */
    createDirect: async (input: CreateCharacterDirectInput): Promise<CreateCharacterResponse> => {
        const { data } = await client.post<CreateCharacterResponse>(
            '/api/character/create-direct',
            input
        );
        return data;
    },

    /**
     * Get a character by ID
     */
    getById: async (characterId: string): Promise<GetCharacterResponse> => {
        const { data } = await client.get<GetCharacterResponse>(
            `/api/character/${characterId}`
        );
        return data;
    },

    /**
     * List characters for current user
     */
    listMyCharacters: async (): Promise<ListCharactersResponse> => {
        const { data } = await client.get<ListCharactersResponse>(
            '/api/character/my'
        );
        return data;
    },

    /**
     * List characters for a specific session
     */
    listBySession: async (sessionId: string): Promise<ListCharactersResponse> => {
        const { data } = await client.get<ListCharactersResponse>(
            `/api/session/${sessionId}/characters`
        );
        return data;
    },

    /**
     * Delete a character
     */
    delete: async (characterId: string): Promise<void> => {
        await client.delete(`/api/character/${characterId}`);
    },
};
