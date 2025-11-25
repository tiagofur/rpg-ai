import { useQuery } from "@tanstack/react-query";
import { client } from "../api/client";
import { Character } from "../types";

export function useCharacter(characterId: string) {
    return useQuery({
        queryKey: ["character", characterId],
        queryFn: async () => {
            const response = await client.get<{ character: Character }>(`/api/character/${characterId}`);
            return response.data.character;
        },
        enabled: !!characterId,
    });
}
