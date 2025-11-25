import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "../api/client";

export interface GameEvent {
    id: string;
    type: string;
    timestamp: string;
    sourceId: string;
    targetId?: string;
    data: Record<string, any>;
}

export interface GameState {
    sessionId: string;
    currentTurn: number;
    history: GameEvent[];
    entities: Record<string, unknown>;
    // Add other fields as needed based on backend response
}

export interface CommandResult {
    success: boolean;
    message: string;
    effects: unknown[];
    newState?: Partial<GameState>;
}

export function useGameSession(sessionId: string) {
    const queryClient = useQueryClient();

    // Start/Initialize Session
    const startSession = useMutation({
        mutationFn: async (data: { characterId: string; settings?: unknown }) => {
            const response = await client.post<GameState>(`/api/game/${sessionId}/start`, data);
            return response.data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["game", sessionId] });
        },
    });

    // Get Session State
    const sessionState = useQuery({
        queryKey: ["game", sessionId],
        queryFn: async () => {
            const response = await client.get<GameState>(`/api/game/${sessionId}`);
            return response.data;
        },
        enabled: !!sessionId,
        refetchInterval: 5000, // Poll every 5 seconds for updates
    });

    // Execute Command
    const executeCommand = useMutation({
        mutationFn: async (data: { type: string; parameters?: unknown }) => {
            const response = await client.post<CommandResult>(`/api/game/${sessionId}/command`, data);
            return response.data;
        },
        onSuccess: () => {
            // Optimistically update or just invalidate
            void queryClient.invalidateQueries({ queryKey: ["game", sessionId] });
        },
    });

    // Undo
    const undoCommand = useMutation({
        mutationFn: async () => {
            const response = await client.post<CommandResult>(`/api/game/${sessionId}/undo`);
            return response.data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["game", sessionId] });
        },
    });

    return {
        startSession,
        sessionState,
        executeCommand,
        undoCommand,
    };
}
