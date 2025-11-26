/**
 * Daily Challenges System Types
 * Sistema de desafíos diarios para retención de jugadores
 */

export type ChallengeType =
    | 'combat'
    | 'exploration'
    | 'collection'
    | 'social'
    | 'survival'
    | 'speedrun'
    | 'achievement';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export type RewardType = 'gold' | 'xp' | 'item' | 'gem' | 'lootbox';

export interface IChallengeReward {
    type: RewardType;
    amount: number;
    itemId?: string;
    itemName?: string;
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface IChallenge {
    id: string;
    title: string;
    description: string;
    icon: string;
    type: ChallengeType;
    difficulty: ChallengeDifficulty;

    // Progress tracking
    objective: {
        target: number;
        current: number;
        unit: string; // "enemies", "locations", "items", etc.
    };

    // Rewards
    rewards: IChallengeReward[];
    bonusReward?: IChallengeReward; // For completing all dailies

    // Constraints
    timeLimit?: number; // In minutes (optional)
    requirements?: {
        minLevel?: number;
        maxLevel?: number;
        specificArea?: string;
        withoutItems?: string[]; // e.g., "without potions"
    };

    // State
    completed: boolean;
    claimed: boolean;
    expiresAt: Date;
}

export interface IDailyState {
    challenges: IChallenge[];
    allCompletedBonus: IChallengeReward | null;
    bonusClaimed: boolean;
    streak: number;
    lastClaimDate: Date | null;
    resetTime: Date;
}

/**
 * Get icon by challenge type
 */
export function getChallengeTypeIcon(type: ChallengeType): string {
    const icons: Record<ChallengeType, string> = {
        combat: '⚔️',
        exploration: '🗺️',
        collection: '📦',
        social: '💬',
        survival: '❤️',
        speedrun: '⏱️',
        achievement: '🏆',
    };
    return icons[type];
}

/**
 * Get color by difficulty
 */
export function getDifficultyColor(difficulty: ChallengeDifficulty): string {
    const colors: Record<ChallengeDifficulty, string> = {
        easy: '#2ECC71',
        medium: '#F39C12',
        hard: '#E74C3C',
        legendary: '#9B59B6',
    };
    return colors[difficulty];
}

/**
 * Get reward icon by type
 */
export function getRewardIcon(type: RewardType): string {
    const icons: Record<RewardType, string> = {
        gold: '🪙',
        xp: '✨',
        item: '🎁',
        gem: '💎',
        lootbox: '📦',
    };
    return icons[type];
}

/**
 * Format time remaining until reset
 */
export function formatTimeRemaining(expiresAt: Date): string {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

/**
 * Calculate progress percentage
 */
export function getProgressPercentage(challenge: IChallenge): number {
    const { current, target } = challenge.objective;
    return Math.min(100, Math.round((current / target) * 100));
}

/**
 * Sample daily challenges for development
 */
export const SAMPLE_DAILIES: IChallenge[] = [
    {
        id: 'daily_combat_1',
        title: 'Monster Hunter',
        description: 'Defeat enemies in combat',
        icon: '👹',
        type: 'combat',
        difficulty: 'easy',
        objective: {
            target: 10,
            current: 3,
            unit: 'enemies',
        },
        rewards: [
            { type: 'gold', amount: 50 },
            { type: 'xp', amount: 100 },
        ],
        completed: false,
        claimed: false,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
    {
        id: 'daily_exploration_1',
        title: 'Cartographer',
        description: 'Discover new locations',
        icon: '🧭',
        type: 'exploration',
        difficulty: 'medium',
        objective: {
            target: 3,
            current: 1,
            unit: 'locations',
        },
        rewards: [
            { type: 'xp', amount: 200 },
            { type: 'item', amount: 1, itemName: 'Map Fragment', rarity: 'uncommon' },
        ],
        completed: false,
        claimed: false,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
    {
        id: 'daily_survival_1',
        title: 'Iron Will',
        description: 'Complete a dungeon without using potions',
        icon: '💪',
        type: 'survival',
        difficulty: 'hard',
        objective: {
            target: 1,
            current: 0,
            unit: 'dungeons',
        },
        rewards: [
            { type: 'gold', amount: 150 },
            { type: 'gem', amount: 5 },
        ],
        requirements: {
            withoutItems: ['health_potion', 'mana_potion'],
        },
        completed: false,
        claimed: false,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
    {
        id: 'daily_speedrun_1',
        title: 'Speed Demon',
        description: 'Complete a quest in under 5 minutes',
        icon: '⚡',
        type: 'speedrun',
        difficulty: 'legendary',
        objective: {
            target: 1,
            current: 0,
            unit: 'quests',
        },
        timeLimit: 5,
        rewards: [
            { type: 'lootbox', amount: 1, itemName: 'Epic Chest', rarity: 'epic' },
            { type: 'xp', amount: 500 },
        ],
        completed: false,
        claimed: false,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
];

/**
 * Bonus reward for completing all dailies
 */
export const DAILY_BONUS_REWARD: IChallengeReward = {
    type: 'lootbox',
    amount: 1,
    itemName: 'Daily Reward Chest',
    rarity: 'rare',
};
