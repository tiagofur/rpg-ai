export interface IAchievement {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: AchievementType;
  readonly category: AchievementCategory;
  readonly points: number;
  readonly rarity: AchievementRarity | string;
  readonly requirements?: Array<IAchievementRequirement>;
  readonly requirement?: number;
  readonly rewards?: Array<IAchievementReward>;
  readonly icon?: string;
  readonly isHidden?: boolean;
  readonly isRepeatable?: boolean;
  readonly maxProgress?: number;
  readonly metadata?: Record<string, any>;
  readonly conditions?: Array<IAchievementCondition>;
}

export interface IAchievementProgress {
  readonly userId: string;
  readonly achievementId: string;
  readonly progress: number;
  readonly maxProgress?: number;
  readonly isCompleted?: boolean;
  readonly unlocked?: boolean;
  readonly completedAt?: Date | null;
  readonly unlockedAt?: Date | null;
  readonly metadata?: Record<string, any>;
  readonly progressData?: Record<string, any>;
}

export interface IAchievementRequirement {
  readonly type: RequirementType;
  readonly target: string;
  readonly value: number;
  readonly operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'neq';
  readonly metadata?: Record<string, any>;
}

export interface IAchievementReward {
  readonly type: RewardType;
  readonly amount: number;
  readonly itemId?: string;
  readonly description: string;
}

export interface IAchievementCondition {
  readonly type: string;
  readonly eventType?: string;
  readonly count?: number;
  readonly items?: Array<string>;
  readonly statType?: string;
  readonly metadata?: Record<string, any>;
}

export enum AchievementType {
  PROGRESSION = 'progression',
  COMBAT = 'combat',
  EXPLORATION = 'exploration',
  SOCIAL = 'social',
  COLLECTION = 'collection',
  SPECIAL = 'special',
  EVENT = 'event',
  PROGRESSIVE = 'progressive',
  SINGLE = 'single'
}

export enum AchievementCategory {
  STORY = 'story',
  CHARACTER = 'character',
  BATTLE = 'battle',
  QUEST = 'quest',
  EXPLORATION = 'exploration',
  CRAFTING = 'crafting',
  SOCIAL = 'social',
  EVENT = 'event',
  SEASONAL = 'seasonal',
  SPECIAL = 'special'
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic'
}

export enum RequirementType {
  LEVEL = 'level',
  QUEST_COMPLETED = 'quest_completed',
  ENEMY_DEFEATED = 'enemy_defeated',
  ITEM_OBTAINED = 'item_obtained',
  SKILL_LEARNED = 'skill_learned',
  AREA_EXPLORED = 'area_explored',
  TIME_PLAYED = 'time_played',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  STAT_REACHED = 'stat_reached'
}

export enum RewardType {
  EXPERIENCE = 'experience',
  GOLD = 'gold',
  ITEM = 'item',
  SKILL = 'skill',
  TITLE = 'title',
  BADGE = 'badge'
}