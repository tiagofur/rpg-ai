const ATTRIBUTE_LEVELS = ["Alta", "Media", "Baja"];
const isAttributeLevel = (value) => typeof value === "string" && ATTRIBUTE_LEVELS.includes(value);
export function serializeCharacter(character) {
    const rawAtributos = (character.atributos ?? {});
    const atributos = Object.fromEntries(Object.entries(rawAtributos).map(([key, value]) => [
        key,
        isAttributeLevel(value) ? value : "Media"
    ]));
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
export function serializeSession(session) {
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
export function serializeSessionSummary(session) {
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
