export interface IQuest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  levelRequirement: number;
  prerequisites?: string[];
  objectives: IQuestObjective[];
  rewards: IQuestReward[];
  timeLimit?: number;
  repeatable: boolean;
  maxRepeats?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuestObjective {
  id: string;
  description: string;
  type: ObjectiveType;
  target?: string;
  targetId?: string;
  current: number;
  required: number;
  completed: boolean;
  metadata?: Record<string, any>;
}

export interface IQuestReward {
  type: RewardType;
  itemId?: string;
  quantity?: number;
  experience?: number;
  gold?: number;
  reputation?: number;
  metadata?: Record<string, any>;
}

export interface IQuestProgress {
  id: string;
  userId: string;
  questId: string;
  objectives: IQuestObjective[];
  status: QuestStatus;
  startedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface IAchievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon?: string;
  points: number;
  requirements: IAchievementRequirement[];
  rewards?: IAchievementReward[];
  hidden: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface IAchievementRequirement {
  type: RequirementType;
  target: string;
  value: number;
  metadata?: Record<string, any>;
}

export interface IAchievementReward {
  type: RewardType;
  itemId?: string;
  quantity?: number;
  experience?: number;
  gold?: number;
  points?: number;
  metadata?: Record<string, any>;
}

export interface IAchievementProgress {
  id: string;
  userId: string;
  achievementId: string;
  progress: Record<string, number>;
  unlocked: boolean;
  unlockedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ILeaderboard {
  id: string;
  name: string;
  description: string;
  type: LeaderboardType;
  category: LeaderboardCategory;
  resetInterval?: ResetInterval;
  maxEntries: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeaderboardEntry {
  id: string;
  leaderboardId: string;
  userId: string;
  username: string;
  value: number;
  rank: number;
  previousRank?: number;
  metadata?: Record<string, any>;
  updatedAt: Date;
}

export interface ILeaderboardRanking {
  leaderboard: ILeaderboard;
  entries: ILeaderboardEntry[];
  totalEntries: number;
  userRank?: ILeaderboardEntry;
  lastReset?: Date;
  nextReset?: Date;
}

export enum QuestType {
  MAIN = 'main',
  SIDE = 'side',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  EVENT = 'event',
  REPEATABLE = 'repeatable'
}

export enum QuestDifficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
  EXPERT = 'expert',
  LEGENDARY = 'legendary'
}

export enum ObjectiveType {
  KILL = 'kill',
  COLLECT = 'collect',
  DELIVER = 'deliver',
  ESCORT = 'escort',
  EXPLORE = 'explore',
  TALK = 'talk',
  CRAFT = 'craft',
  WIN_BATTLE = 'win_battle',
  REACH_LEVEL = 'reach_level',
  COMPLETE_DUNGEON = 'complete_dungeon'
}

export enum RewardType {
  ITEM = 'item',
  EXPERIENCE = 'experience',
  GOLD = 'gold',
  REPUTATION = 'reputation',
  ACHIEVEMENT_POINTS = 'achievement_points'
}

export enum QuestStatus {
  AVAILABLE = 'available',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum AchievementCategory {
  COMBAT = 'combat',
  EXPLORATION = 'exploration',
  SOCIAL = 'social',
  COLLECTION = 'collection',
  PROGRESSION = 'progression',
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
  KILL = 'kill',
  COLLECT = 'collect',
  WIN_BATTLE = 'win_battle',
  REACH_LEVEL = 'reach_level',
  COMPLETE_QUEST = 'complete_quest',
  UNLOCK_ACHIEVEMENT = 'unlock_achievement',
  CRAFT_ITEM = 'craft_item',
  EXPLORE_AREA = 'explore_area',
  SOCIAL_INTERACTION = 'social_interaction'
}

export enum LeaderboardType {
  HIGHEST_VALUE = 'highest_value',
  LOWEST_VALUE = 'lowest_value',
  CUMULATIVE = 'cumulative',
  AVERAGE = 'average',
  STREAK = 'streak'
}

export enum LeaderboardCategory {
  COMBAT = 'combat',
  PROGRESSION = 'progression',
  SOCIAL = 'social',
  COLLECTION = 'collection',
  ACTIVITY = 'activity',
  SPECIAL = 'special'
}

export enum ResetInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  SEASONAL = 'seasonal',
  NEVER = 'never'
}