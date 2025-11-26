/**
 * Bestiary System Types
 * Tipos para el sistema de bestiario
 */

export type CreatureType =
    | 'beast'
    | 'undead'
    | 'demon'
    | 'dragon'
    | 'humanoid'
    | 'elemental'
    | 'construct'
    | 'aberration'
    | 'plant'
    | 'fey';

export type CreatureRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'boss';

export type DamageType =
    | 'physical'
    | 'fire'
    | 'ice'
    | 'lightning'
    | 'poison'
    | 'dark'
    | 'holy'
    | 'arcane';

export interface ICreatureStats {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    level: number;
}

export interface ICreatureDrop {
    itemId: string;
    itemName: string;
    dropRate: number; // 0-1
    minQuantity: number;
    maxQuantity: number;
}

export interface ICreature {
    id: string;
    name: string;
    title?: string; // e.g., "The Undying", "Guardian of the Forest"
    description: string;
    lore: string;
    icon: string; // Emoji for now
    type: CreatureType;
    rarity: CreatureRarity;

    stats: ICreatureStats;
    weaknesses: DamageType[];
    resistances: DamageType[];
    immunities?: DamageType[];

    abilities?: string[];
    drops: ICreatureDrop[];

    xpReward: number;
    goldReward: { min: number; max: number };

    habitat?: string[]; // Locations where found
    imageUrl?: string;
}

export interface IBestiaryEntry {
    creatureId: string;
    discovered: boolean;
    timesDefeated: number;
    firstEncounter?: Date;
    lastEncounter?: Date;
    dropsObtained: Record<string, number>; // itemId -> quantity
    notes?: string; // Player notes
}

export interface IBestiaryState {
    entries: Record<string, IBestiaryEntry>;
    totalDiscovered: number;
    totalCreatures: number;
    favorites: string[];
}

/**
 * Get color by rarity
 */
export function getRarityColor(rarity: CreatureRarity): string {
    switch (rarity) {
        case 'common':
            return '#AAAAAA';
        case 'uncommon':
            return '#2ECC71';
        case 'rare':
            return '#3498DB';
        case 'epic':
            return '#9B59B6';
        case 'legendary':
            return '#F39C12';
        case 'boss':
            return '#E74C3C';
        default:
            return '#FFFFFF';
    }
}

/**
 * Get creature type icon
 */
export function getCreatureTypeIcon(type: CreatureType): string {
    switch (type) {
        case 'beast':
            return '🐺';
        case 'undead':
            return '💀';
        case 'demon':
            return '👿';
        case 'dragon':
            return '🐉';
        case 'humanoid':
            return '👤';
        case 'elemental':
            return '🌀';
        case 'construct':
            return '🤖';
        case 'aberration':
            return '👁️';
        case 'plant':
            return '🌿';
        case 'fey':
            return '🧚';
        default:
            return '❓';
    }
}

/**
 * Get damage type icon
 */
export function getDamageTypeIcon(type: DamageType): string {
    switch (type) {
        case 'physical':
            return '⚔️';
        case 'fire':
            return '🔥';
        case 'ice':
            return '❄️';
        case 'lightning':
            return '⚡';
        case 'poison':
            return '☠️';
        case 'dark':
            return '🌑';
        case 'holy':
            return '✨';
        case 'arcane':
            return '💫';
        default:
            return '❓';
    }
}

/**
 * Get damage type color
 */
export function getDamageTypeColor(type: DamageType): string {
    switch (type) {
        case 'physical':
            return '#CCCCCC';
        case 'fire':
            return '#FF6B35';
        case 'ice':
            return '#4ECDC4';
        case 'lightning':
            return '#FFE66D';
        case 'poison':
            return '#9B59B6';
        case 'dark':
            return '#8E44AD';
        case 'holy':
            return '#F7DC6F';
        case 'arcane':
            return '#3498DB';
        default:
            return '#FFFFFF';
    }
}

/**
 * Format drop rate as percentage
 */
export function formatDropRate(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Sample creatures for testing
 */
export const SAMPLE_CREATURES: ICreature[] = [
    {
        id: 'giant_rat',
        name: 'Giant Rat',
        description: 'An oversized rodent with glowing red eyes and razor-sharp teeth.',
        lore: 'These vermin infest the sewers and cellars of every major city. While individually weak, they can overwhelm unprepared adventurers with sheer numbers.',
        icon: '🐀',
        type: 'beast',
        rarity: 'common',
        stats: { hp: 15, attack: 5, defense: 2, speed: 8, level: 1 },
        weaknesses: ['fire'],
        resistances: [],
        drops: [
            { itemId: 'rat_tail', itemName: 'Rat Tail', dropRate: 0.8, minQuantity: 1, maxQuantity: 2 },
            { itemId: 'small_fang', itemName: 'Small Fang', dropRate: 0.3, minQuantity: 1, maxQuantity: 1 },
        ],
        xpReward: 10,
        goldReward: { min: 1, max: 5 },
        habitat: ['Sewers', 'Cellars', 'Abandoned Buildings'],
    },
    {
        id: 'forest_wolf',
        name: 'Forest Wolf',
        description: 'A cunning predator with silver-gray fur and piercing yellow eyes.',
        lore: 'Forest wolves are intelligent hunters that work in coordinated packs. They are sacred to the followers of the Moon Goddess.',
        icon: '🐺',
        type: 'beast',
        rarity: 'common',
        stats: { hp: 35, attack: 12, defense: 5, speed: 12, level: 3 },
        weaknesses: ['fire'],
        resistances: ['ice'],
        drops: [
            { itemId: 'wolf_pelt', itemName: 'Wolf Pelt', dropRate: 0.6, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'wolf_fang', itemName: 'Wolf Fang', dropRate: 0.4, minQuantity: 1, maxQuantity: 2 },
        ],
        xpReward: 25,
        goldReward: { min: 5, max: 15 },
        habitat: ['Forest', 'Mountains'],
    },
    {
        id: 'skeleton_warrior',
        name: 'Skeleton Warrior',
        description: 'An animated skeleton clad in rusted armor, wielding a notched blade.',
        lore: 'These undead soldiers were once proud warriors who fell in battle. Dark magic has bound their souls to their bones.',
        icon: '💀',
        type: 'undead',
        rarity: 'uncommon',
        stats: { hp: 45, attack: 15, defense: 10, speed: 6, level: 5 },
        weaknesses: ['holy', 'physical'],
        resistances: ['dark', 'poison'],
        immunities: ['poison'],
        drops: [
            { itemId: 'bone_dust', itemName: 'Bone Dust', dropRate: 0.7, minQuantity: 1, maxQuantity: 3 },
            { itemId: 'rusted_sword', itemName: 'Rusted Sword', dropRate: 0.15, minQuantity: 1, maxQuantity: 1 },
        ],
        xpReward: 40,
        goldReward: { min: 10, max: 25 },
        habitat: ['Crypts', 'Ruins', 'Battlefields'],
    },
    {
        id: 'fire_elemental',
        name: 'Fire Elemental',
        title: 'Living Flame',
        description: 'A swirling vortex of pure fire given sentience.',
        lore: 'Fire elementals are summoned from the Plane of Fire. They are driven by an insatiable hunger to consume all in their path.',
        icon: '🔥',
        type: 'elemental',
        rarity: 'rare',
        stats: { hp: 80, attack: 25, defense: 8, speed: 10, level: 10 },
        weaknesses: ['ice'],
        resistances: ['fire', 'physical'],
        immunities: ['fire', 'poison'],
        abilities: ['Burning Touch', 'Flame Burst'],
        drops: [
            { itemId: 'fire_essence', itemName: 'Fire Essence', dropRate: 0.5, minQuantity: 1, maxQuantity: 2 },
            { itemId: 'ember_core', itemName: 'Ember Core', dropRate: 0.1, minQuantity: 1, maxQuantity: 1 },
        ],
        xpReward: 100,
        goldReward: { min: 30, max: 60 },
        habitat: ['Volcanic Caves', 'Fire Temple'],
    },
    {
        id: 'shadow_demon',
        name: 'Shadow Demon',
        title: 'Nightstalker',
        description: 'A being of pure darkness with glowing crimson eyes.',
        lore: 'Shadow demons slip through the veil between worlds during the darkest nights. They feed on fear and despair.',
        icon: '👿',
        type: 'demon',
        rarity: 'epic',
        stats: { hp: 150, attack: 35, defense: 20, speed: 15, level: 15 },
        weaknesses: ['holy', 'lightning'],
        resistances: ['dark', 'physical'],
        immunities: ['dark'],
        abilities: ['Shadow Step', 'Life Drain', 'Terror Aura'],
        drops: [
            { itemId: 'shadow_essence', itemName: 'Shadow Essence', dropRate: 0.4, minQuantity: 1, maxQuantity: 2 },
            { itemId: 'demon_horn', itemName: 'Demon Horn', dropRate: 0.2, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'dark_crystal', itemName: 'Dark Crystal', dropRate: 0.05, minQuantity: 1, maxQuantity: 1 },
        ],
        xpReward: 250,
        goldReward: { min: 80, max: 150 },
        habitat: ['Shadow Realm', 'Corrupted Shrine'],
    },
    {
        id: 'ancient_dragon',
        name: 'Vyraxis',
        title: 'The Eternal Flame',
        description: 'An ancient dragon whose scales shimmer like molten gold.',
        lore: 'Vyraxis has lived for millennia, watching empires rise and fall. She guards a hoard of treasures beyond imagination.',
        icon: '🐉',
        type: 'dragon',
        rarity: 'legendary',
        stats: { hp: 500, attack: 60, defense: 40, speed: 12, level: 25 },
        weaknesses: ['ice'],
        resistances: ['fire', 'physical', 'arcane'],
        immunities: ['fire'],
        abilities: ['Dragon Breath', 'Wing Buffet', 'Ancient Roar', 'Flame Aura'],
        drops: [
            { itemId: 'dragon_scale', itemName: 'Dragon Scale', dropRate: 1, minQuantity: 2, maxQuantity: 5 },
            { itemId: 'dragon_heart', itemName: "Dragon's Heart", dropRate: 0.3, minQuantity: 1, maxQuantity: 1 },
            { itemId: 'legendary_treasure', itemName: 'Legendary Treasure', dropRate: 0.1, minQuantity: 1, maxQuantity: 1 },
        ],
        xpReward: 1000,
        goldReward: { min: 500, max: 1000 },
        habitat: ["Dragon's Lair", 'Volcanic Peak'],
    },
];
