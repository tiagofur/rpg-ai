/**
 * Loot Tables - Define qué items dropean los enemigos
 * 
 * Cada enemigo tiene una tabla de loot con probabilidades de drop
 */

export interface ILootDrop {
    /** ID del item template */
    itemId: string;
    /** Probabilidad de drop (0.0 - 1.0) */
    chance: number;
    /** Cantidad mínima */
    minQuantity: number;
    /** Cantidad máxima */
    maxQuantity: number;
}

export interface ILootTable {
    /** ID del enemigo */
    enemyId: string;
    /** Oro garantizado (min-max) */
    guaranteedGold: { min: number; max: number };
    /** Lista de drops posibles */
    drops: ILootDrop[];
}

/**
 * Tablas de loot para todos los enemigos del juego
 */
export const LOOT_TABLES: Record<string, ILootTable> = {
    // ===== BESTIAS =====
    'enemy_giant_rat': {
        enemyId: 'enemy_giant_rat',
        guaranteedGold: { min: 2, max: 8 },
        drops: [
            { itemId: 'material_rat_tail', chance: 0.8, minQuantity: 1, maxQuantity: 2 },
            { itemId: 'material_small_cheese', chance: 0.3, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'potion_health_minor', chance: 0.05, minQuantity: 1, maxQuantity: 1 },
        ],
    },

    'enemy_wolf': {
        enemyId: 'enemy_wolf',
        guaranteedGold: { min: 0, max: 0 }, // Los lobos no llevan oro
        drops: [
            { itemId: 'material_wolf_pelt', chance: 0.9, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'material_wolf_fang', chance: 0.6, minQuantity: 1, maxQuantity: 3 },
            { itemId: 'material_wolf_raw_meat', chance: 0.8, minQuantity: 1, maxQuantity: 2 },
            { itemId: 'material_pristine_pelt', chance: 0.08, minQuantity: 1, maxQuantity: 1 },
        ],
    },

    // ===== HUMANOIDES =====
    'enemy_bandit': {
        enemyId: 'enemy_bandit',
        guaranteedGold: { min: 15, max: 35 },
        drops: [
            { itemId: 'armor_bandit_cloak', chance: 0.4, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'weapon_bandit_dagger', chance: 0.15, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'weapon_iron_dagger', chance: 0.1, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'potion_health_minor', chance: 0.25, minQuantity: 1, maxQuantity: 2 },
            { itemId: 'material_stolen_goods', chance: 0.35, minQuantity: 1, maxQuantity: 2 },
        ],
    },

    // ===== GOBLIN =====
    'enemy_goblin': {
        enemyId: 'enemy_goblin',
        guaranteedGold: { min: 5, max: 15 },
        drops: [
            { itemId: 'material_goblin_ear', chance: 0.75, minQuantity: 1, maxQuantity: 2 },
            { itemId: 'weapon_goblin_shiv', chance: 0.15, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'armor_goblin_rags', chance: 0.1, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'potion_health_minor', chance: 0.15, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'material_shiny_stone', chance: 0.5, minQuantity: 1, maxQuantity: 3 },
        ],
    },

    // ===== SKELETON =====
    'enemy_skeleton': {
        enemyId: 'enemy_skeleton',
        guaranteedGold: { min: 0, max: 5 },
        drops: [
            { itemId: 'material_bone', chance: 0.9, minQuantity: 2, maxQuantity: 5 },
            { itemId: 'material_ancient_coin', chance: 0.2, minQuantity: 1, maxQuantity: 3 },
            { itemId: 'weapon_bone_club', chance: 0.1, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'weapon_rusty_sword', chance: 0.08, minQuantity: 1, maxQuantity: 1 },
        ],
    },
};

/**
 * Obtiene la tabla de loot de un enemigo
 * @param enemyId ID del enemigo
 * @returns Tabla de loot o undefined si no existe
 */
export function getLootTable(enemyId: string): ILootTable | undefined {
    return LOOT_TABLES[enemyId];
}

/**
 * Obtiene todas las tablas de loot disponibles
 */
export function getAllLootTables(): ILootTable[] {
    return Object.values(LOOT_TABLES);
}
