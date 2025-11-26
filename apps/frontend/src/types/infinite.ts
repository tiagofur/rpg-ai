/**
 * Infinite Mode Types
 * Dungeon crawler roguelike con generación procedural
 */

export type RoomType =
    | 'entrance'
    | 'combat'
    | 'treasure'
    | 'trap'
    | 'puzzle'
    | 'rest'
    | 'shop'
    | 'miniboss'
    | 'boss'
    | 'exit';

export type DungeonTheme =
    | 'crypt'
    | 'cave'
    | 'temple'
    | 'sewer'
    | 'forest'
    | 'volcano'
    | 'ice'
    | 'void';

export interface IRoom {
    id: string;
    type: RoomType;
    name: string;
    description: string;
    enemies?: IEnemy[];
    loot?: ILoot[];
    trap?: ITrap;
    puzzle?: IPuzzle;
    isCleared: boolean;
    isRevealed: boolean;
    connections: string[]; // Room IDs
    position: { x: number; y: number };
}

export interface IEnemy {
    id: string;
    name: string;
    icon: string;
    hp: number;
    maxHp: number;
    damage: number;
    xpReward: number;
    goldReward: number;
    isBoss: boolean;
}

export interface ILoot {
    id: string;
    name: string;
    icon: string;
    type: 'gold' | 'item' | 'potion' | 'equipment' | 'key';
    value: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface ITrap {
    id: string;
    name: string;
    icon: string;
    damage: number;
    isDisarmed: boolean;
    disarmDifficulty: number; // 1-10
}

export interface IPuzzle {
    id: string;
    name: string;
    description: string;
    isSolved: boolean;
    reward: ILoot;
}

export interface IDungeonFloor {
    level: number;
    theme: DungeonTheme;
    rooms: IRoom[];
    currentRoomId: string;
    isCompleted: boolean;
    startTime: Date;
    endTime?: Date;
}

export interface IInfiniteRun {
    id: string;
    startedAt: Date;
    endedAt?: Date;
    currentFloor: number;
    highestFloor: number;
    totalKills: number;
    totalGold: number;
    totalXp: number;
    deaths: number;
    floors: IDungeonFloor[];
    isActive: boolean;
}

export interface ILeaderboardEntry {
    rank: number;
    playerId: string;
    playerName: string;
    highestFloor: number;
    totalKills: number;
    totalGold: number;
    playTime: number; // In seconds
    achievedAt: Date;
}

export interface IInfiniteState {
    currentRun: IInfiniteRun | null;
    bestRun: IInfiniteRun | null;
    leaderboard: ILeaderboardEntry[];
    unlockedThemes: DungeonTheme[];
    totalRuns: number;
}

// Room type icons
export function getRoomIcon(type: RoomType): string {
    const icons: Record<RoomType, string> = {
        entrance: '🚪',
        combat: '⚔️',
        treasure: '💰',
        trap: '⚠️',
        puzzle: '🧩',
        rest: '🏕️',
        shop: '🛒',
        miniboss: '👹',
        boss: '🐉',
        exit: '🚀',
    };
    return icons[type];
}

// Theme gradients
export function getThemeGradient(theme: DungeonTheme): [string, string] {
    const gradients: Record<DungeonTheme, [string, string]> = {
        crypt: ['#2C3E50', '#1a1a2e'],
        cave: ['#4A4A4A', '#2C2C2C'],
        temple: ['#DAA520', '#8B4513'],
        sewer: ['#556B2F', '#2F4F4F'],
        forest: ['#228B22', '#006400'],
        volcano: ['#FF4500', '#8B0000'],
        ice: ['#87CEEB', '#4169E1'],
        void: ['#4B0082', '#0D0D0D'],
    };
    return gradients[theme];
}

// Theme icons
export function getThemeIcon(theme: DungeonTheme): string {
    const icons: Record<DungeonTheme, string> = {
        crypt: '💀',
        cave: '🦇',
        temple: '⛩️',
        sewer: '🐀',
        forest: '🌲',
        volcano: '🌋',
        ice: '❄️',
        void: '🌑',
    };
    return icons[theme];
}

// Loot rarity colors
export function getRarityColor(rarity: ILoot['rarity']): string {
    const colors: Record<ILoot['rarity'], string> = {
        common: '#9E9E9E',
        uncommon: '#4CAF50',
        rare: '#2196F3',
        epic: '#9C27B0',
        legendary: '#FF9800',
    };
    return colors[rarity];
}

// Calculate floor difficulty multiplier
export function getFloorMultiplier(floor: number): number {
    return 1 + (floor - 1) * 0.15;
}

// Check if floor is a special floor
export function isShopFloor(floor: number): boolean {
    return floor % 5 === 0 && floor % 10 !== 0;
}

export function isBossFloor(floor: number): boolean {
    return floor % 10 === 0;
}

export function isMinibossFloor(floor: number): boolean {
    return floor % 5 === 0 && floor % 10 !== 0;
}

// Get floor type description
export function getFloorTypeLabel(floor: number): string {
    if (isBossFloor(floor)) return 'Boss Floor';
    if (isMinibossFloor(floor)) return 'Mini-Boss Floor';
    if (floor === 1) return 'Starting Floor';
    return `Floor ${floor}`;
}

// Sample enemies by theme
export const SAMPLE_ENEMIES: Record<DungeonTheme, IEnemy[]> = {
    crypt: [
        { id: 'skeleton', name: 'Skeleton Warrior', icon: '💀', hp: 30, maxHp: 30, damage: 8, xpReward: 15, goldReward: 10, isBoss: false },
        { id: 'zombie', name: 'Undead Husk', icon: '🧟', hp: 45, maxHp: 45, damage: 12, xpReward: 25, goldReward: 15, isBoss: false },
        { id: 'lich', name: 'Ancient Lich', icon: '🧙‍♂️', hp: 200, maxHp: 200, damage: 35, xpReward: 150, goldReward: 100, isBoss: true },
    ],
    cave: [
        { id: 'bat', name: 'Giant Bat', icon: '🦇', hp: 20, maxHp: 20, damage: 5, xpReward: 10, goldReward: 5, isBoss: false },
        { id: 'spider', name: 'Cave Spider', icon: '🕷️', hp: 35, maxHp: 35, damage: 10, xpReward: 20, goldReward: 12, isBoss: false },
        { id: 'golem', name: 'Stone Golem', icon: '🗿', hp: 180, maxHp: 180, damage: 30, xpReward: 120, goldReward: 80, isBoss: true },
    ],
    temple: [
        { id: 'cultist', name: 'Dark Cultist', icon: '🧙', hp: 40, maxHp: 40, damage: 12, xpReward: 22, goldReward: 18, isBoss: false },
        { id: 'guardian', name: 'Temple Guardian', icon: '🗡️', hp: 60, maxHp: 60, damage: 18, xpReward: 35, goldReward: 25, isBoss: false },
        { id: 'avatar', name: 'Dark Avatar', icon: '👁️', hp: 250, maxHp: 250, damage: 40, xpReward: 200, goldReward: 150, isBoss: true },
    ],
    sewer: [
        { id: 'rat', name: 'Giant Rat', icon: '🐀', hp: 15, maxHp: 15, damage: 4, xpReward: 8, goldReward: 4, isBoss: false },
        { id: 'slime', name: 'Toxic Slime', icon: '🟢', hp: 50, maxHp: 50, damage: 8, xpReward: 18, goldReward: 10, isBoss: false },
        { id: 'croc', name: 'Sewer King', icon: '🐊', hp: 150, maxHp: 150, damage: 25, xpReward: 100, goldReward: 70, isBoss: true },
    ],
    forest: [
        { id: 'wolf', name: 'Dire Wolf', icon: '🐺', hp: 35, maxHp: 35, damage: 12, xpReward: 18, goldReward: 8, isBoss: false },
        { id: 'treant', name: 'Corrupted Treant', icon: '🌳', hp: 70, maxHp: 70, damage: 15, xpReward: 40, goldReward: 20, isBoss: false },
        { id: 'dragon', name: 'Forest Dragon', icon: '🐲', hp: 220, maxHp: 220, damage: 38, xpReward: 180, goldReward: 120, isBoss: true },
    ],
    volcano: [
        { id: 'imp', name: 'Fire Imp', icon: '👿', hp: 25, maxHp: 25, damage: 15, xpReward: 20, goldReward: 15, isBoss: false },
        { id: 'elemental', name: 'Fire Elemental', icon: '🔥', hp: 55, maxHp: 55, damage: 22, xpReward: 45, goldReward: 30, isBoss: false },
        { id: 'phoenix', name: 'Infernal Phoenix', icon: '🦅', hp: 200, maxHp: 200, damage: 45, xpReward: 200, goldReward: 150, isBoss: true },
    ],
    ice: [
        { id: 'yeti', name: 'Ice Yeti', icon: '🦍', hp: 60, maxHp: 60, damage: 18, xpReward: 35, goldReward: 22, isBoss: false },
        { id: 'wraith', name: 'Frost Wraith', icon: '👻', hp: 40, maxHp: 40, damage: 20, xpReward: 28, goldReward: 18, isBoss: false },
        { id: 'queen', name: 'Ice Queen', icon: '👑', hp: 180, maxHp: 180, damage: 35, xpReward: 160, goldReward: 100, isBoss: true },
    ],
    void: [
        { id: 'shade', name: 'Void Shade', icon: '👤', hp: 45, maxHp: 45, damage: 25, xpReward: 40, goldReward: 30, isBoss: false },
        { id: 'horror', name: 'Eldritch Horror', icon: '🦑', hp: 80, maxHp: 80, damage: 30, xpReward: 60, goldReward: 45, isBoss: false },
        { id: 'elder', name: 'Void Elder', icon: '🌀', hp: 300, maxHp: 300, damage: 50, xpReward: 300, goldReward: 200, isBoss: true },
    ],
};

// Sample run for development
export const SAMPLE_RUN: IInfiniteRun = {
    id: 'sample-run-1',
    startedAt: new Date(),
    currentFloor: 3,
    highestFloor: 3,
    totalKills: 12,
    totalGold: 156,
    totalXp: 320,
    deaths: 0,
    floors: [],
    isActive: true,
};

// Sample leaderboard
export const SAMPLE_LEADERBOARD: ILeaderboardEntry[] = [
    { rank: 1, playerId: 'p1', playerName: 'DragonSlayer', highestFloor: 47, totalKills: 234, totalGold: 12_500, playTime: 7200, achievedAt: new Date() },
    { rank: 2, playerId: 'p2', playerName: 'ShadowMage', highestFloor: 42, totalKills: 198, totalGold: 10_200, playTime: 6500, achievedAt: new Date() },
    { rank: 3, playerId: 'p3', playerName: 'IronKnight', highestFloor: 38, totalKills: 176, totalGold: 8900, playTime: 5800, achievedAt: new Date() },
    { rank: 4, playerId: 'p4', playerName: 'StormCaller', highestFloor: 35, totalKills: 158, totalGold: 7600, playTime: 5200, achievedAt: new Date() },
    { rank: 5, playerId: 'p5', playerName: 'NightHunter', highestFloor: 31, totalKills: 142, totalGold: 6400, playTime: 4600, achievedAt: new Date() },
];
