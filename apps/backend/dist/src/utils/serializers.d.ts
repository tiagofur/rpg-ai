import type { Prisma } from "@prisma/client";
import type { Character, Session, SessionSummary } from "@rpg-ai/shared";
type CharacterRecord = Prisma.CharacterGetPayload<{}>;
export declare function serializeCharacter(character: CharacterRecord): Character;
type SessionWithCharacters = Prisma.SessionGetPayload<{
    include: {
        characters: true;
    };
}>;
export declare function serializeSession(session: SessionWithCharacters): Session;
export declare function serializeSessionSummary(session: SessionWithCharacters): SessionSummary;
export {};
