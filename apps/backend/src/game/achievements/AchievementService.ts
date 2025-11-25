import { EventEmitter } from 'node:events';
import { IAchievement, IAchievementProgress, AchievementType, AchievementCategory, AchievementRarity } from '../../interfaces/IAchievement.js';
import { IWebSocketManager } from '../../websocket/interfaces/IWebSocketManager.js';
import { GameError, ErrorCode } from '../../errors/GameError.js';
import { IRedisClient } from '../../cache/interfaces/IRedisClient.js';
import { ILogger } from '../../logging/interfaces/ILogger.js';

export interface IAchievementService {
  initialize(): Promise<void>;
  checkAchievements(userId: string, eventType: string, eventData: any): Promise<Array<IAchievementProgress>>;
  getUserAchievements(userId: string): Promise<Array<IAchievementProgress>>;
  getAchievementById(achievementId: string): Promise<IAchievement | null>;
  unlockAchievement(userId: string, achievementId: string): Promise<IAchievementProgress>;
  getLeaderboard(category?: AchievementCategory): Promise<Array<{ userId: string; points: number; achievements: number }>>;
}

export class AchievementService extends EventEmitter implements IAchievementService {
  private readonly achievements: Map<string, IAchievement> = new Map();

  private readonly ACHIEVEMENTS_KEY = 'achievements:definitions';

  private readonly USER_ACHIEVEMENTS_KEY = 'achievements:user:';

  private readonly LEADERBOARD_KEY = 'achievements:leaderboard';

  constructor(
    private readonly websocketManager: IWebSocketManager,
    private readonly redis: IRedisClient,
    private readonly logger: ILogger
  ) {
    super();
  }

  async initialize(): Promise<void> {
    try {
      await this.loadAchievements();
      this.logger.info('Achievement service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize achievement service', { error });
      throw new GameError(
        'Failed to initialize achievement service',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  private async loadAchievements(): Promise<void> {
    // Load from Redis cache first
    const cachedAchievements = await this.redis.get(this.ACHIEVEMENTS_KEY);

    if (cachedAchievements) {
      const achievements = JSON.parse(cachedAchievements);
      achievements.forEach((achievement: IAchievement) => {
        this.achievements.set(achievement.id, achievement);
      });
    } else {
      // Load default achievements
      await this.loadDefaultAchievements();
    }
  }

  private async loadDefaultAchievements(): Promise<void> {
    const defaultAchievements: Array<IAchievement> = [
      // Combat Achievements
      {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Defeat your first enemy',
        category: AchievementCategory.BATTLE,
        type: AchievementType.PROGRESSIVE,
        requirement: 1,
        points: 10,
        icon: '🗡️',
        rarity: AchievementRarity.COMMON,
        conditions: [
          { type: 'event', eventType: 'enemy_defeated', count: 1 }
        ]
      },
      {
        id: 'warrior',
        name: 'Warrior',
        description: 'Defeat 100 enemies',
        category: AchievementCategory.BATTLE,
        type: AchievementType.PROGRESSIVE,
        requirement: 100,
        points: 50,
        icon: '⚔️',
        rarity: AchievementRarity.UNCOMMON,
        conditions: [
          { type: 'event', eventType: 'enemy_defeated', count: 100 }
        ]
      },
      {
        id: 'legendary_warrior',
        name: 'Legendary Warrior',
        description: 'Defeat 1000 enemies',
        category: AchievementCategory.BATTLE,
        type: AchievementType.PROGRESSIVE,
        requirement: 1000,
        points: 200,
        icon: '🏆',
        rarity: AchievementRarity.LEGENDARY,
        conditions: [
          { type: 'event', eventType: 'enemy_defeated', count: 1000 }
        ]
      },
      {
        id: 'boss_slayer',
        name: 'Boss Slayer',
        description: 'Defeat 10 boss enemies',
        category: AchievementCategory.BATTLE,
        type: AchievementType.PROGRESSIVE,
        requirement: 10,
        points: 100,
        icon: '👹',
        rarity: AchievementRarity.RARE,
        conditions: [
          { type: 'event', eventType: 'boss_defeated', count: 10 }
        ]
      },

      // Exploration Achievements
      {
        id: 'explorer',
        name: 'Explorer',
        description: 'Discover 10 new locations',
        category: AchievementCategory.EXPLORATION,
        type: AchievementType.PROGRESSIVE,
        requirement: 10,
        points: 25,
        icon: '🗺️',
        rarity: 'common',
        conditions: [
          { type: 'event', eventType: 'location_discovered', count: 10 }
        ]
      },
      {
        id: 'world_traveler',
        name: 'World Traveler',
        description: 'Visit all major cities',
        category: AchievementCategory.EXPLORATION,
        type: AchievementType.COLLECTION,
        requirement: 5,
        points: 75,
        icon: '🌍',
        rarity: 'rare',
        conditions: [
          { type: 'collection', eventType: 'city_visited', items: ['capital_city', 'port_city', 'mountain_city', 'desert_city', 'forest_city'] }
        ]
      },
      {
        id: 'treasure_hunter',
        name: 'Treasure Hunter',
        description: 'Find 50 treasure chests',
        category: AchievementCategory.EXPLORATION,
        type: AchievementType.PROGRESSIVE,
        requirement: 50,
        points: 60,
        icon: '💎',
        rarity: 'uncommon',
        conditions: [
          { type: 'event', eventType: 'treasure_found', count: 50 }
        ]
      },

      // Social Achievements
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Make 20 friends',
        category: AchievementCategory.SOCIAL,
        type: AchievementType.PROGRESSIVE,
        requirement: 20,
        points: 40,
        icon: '🦋',
        rarity: 'uncommon',
        conditions: [
          { type: 'event', eventType: 'friend_added', count: 20 }
        ]
      },
      {
        id: 'guild_master',
        name: 'Guild Master',
        description: 'Create or lead a guild',
        category: AchievementCategory.SOCIAL,
        type: AchievementType.SINGLE,
        requirement: 1,
        points: 80,
        icon: '👑',
        rarity: 'rare',
        conditions: [
          { type: 'event', eventType: 'guild_created', count: 1 }
        ]
      },
      {
        id: 'mentor',
        name: 'Mentor',
        description: 'Help 10 new players',
        category: AchievementCategory.SOCIAL,
        type: AchievementType.PROGRESSIVE,
        requirement: 10,
        points: 35,
        icon: '🎓',
        rarity: 'common',
        conditions: [
          { type: 'event', eventType: 'player_helped', count: 10 }
        ]
      },

      // Special Achievements
      {
        id: 'first_login',
        name: 'Welcome!',
        description: 'Log in for the first time',
        category: AchievementCategory.SPECIAL,
        type: AchievementType.SINGLE,
        requirement: 1,
        points: 5,
        icon: '👋',
        rarity: 'common',
        conditions: [
          { type: 'event', eventType: 'first_login', count: 1 }
        ]
      },
      {
        id: 'dedicated_player',
        name: 'Dedicated Player',
        description: 'Play for 100 hours',
        category: AchievementCategory.SPECIAL,
        type: AchievementType.PROGRESSIVE,
        requirement: 100,
        points: 150,
        icon: '⏰',
        rarity: AchievementRarity.EPIC,
        conditions: [
          { type: 'stat', statType: 'playtime_hours', count: 100 }
        ]
      },
      {
        id: 'perfect_day',
        name: 'Perfect Day',
        description: 'Complete all daily quests in one day',
        category: AchievementCategory.SPECIAL,
        type: AchievementType.SINGLE,
        requirement: 1,
        points: 30,
        icon: '☀️',
        rarity: 'uncommon',
        conditions: [
          { type: 'event', eventType: 'daily_quests_completed', count: 1 }
        ]
      }
    ];

    for (const achievement of defaultAchievements) {
      this.achievements.set(achievement.id, achievement);
    }

    // Cache achievements
    await this.redis.setex(
      this.ACHIEVEMENTS_KEY,
      3600, // 1 hour TTL
      JSON.stringify(defaultAchievements)
    );
  }

  async checkAchievements(userId: string, eventType: string, eventData: any): Promise<Array<IAchievementProgress>> {
    try {
      const userAchievements = await this.getUserAchievements(userId);
      const unlockedAchievements: Array<IAchievementProgress> = [];

      for (const [achievementId, achievement] of this.achievements) {
        // Skip if already unlocked
        const existingProgress = userAchievements.find(p => p.achievementId === achievementId);
        if (existingProgress?.unlocked) {
          continue;
        }

        // Check if achievement conditions are met
        if (this.shouldCheckAchievement(achievement, eventType, eventData)) {
          const progress = await this.updateAchievementProgress(userId, achievement, eventData);

          if (progress.unlocked) {
            unlockedAchievements.push(progress);
            await this.notifyAchievementUnlocked(userId, achievement, progress);
          }
        }
      }

      return unlockedAchievements;
    } catch (error) {
      this.logger.error('Error checking achievements', { userId, eventType, error });
      throw new GameError(
        'Failed to check achievements',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  private shouldCheckAchievement(achievement: IAchievement, eventType: string, eventData: any): boolean {
    if (!achievement.conditions) {
      return false;
    }
    return achievement.conditions.some((condition: any) => {
      switch (condition.type) {
        case 'event': {
          return condition.eventType === eventType;
        }
        case 'stat': {
          return this.checkStatCondition(condition, eventData);
        }
        case 'collection': {
          return this.checkCollectionCondition(condition, eventData);
        }
        default: {
          return false;
        }
      }
    });
  }

  private checkStatCondition(condition: any, eventData: any): boolean {
    return eventData[condition.statType] !== undefined;
  }

  private checkCollectionCondition(condition: any, eventData: any): boolean {
    return condition.items.includes(eventData.itemId);
  }

  private async updateAchievementProgress(userId: string, achievement: IAchievement, eventData: any): Promise<IAchievementProgress> {
    const progressKey = `${this.USER_ACHIEVEMENTS_KEY}${userId}:${achievement.id}`;
    const existingProgress = await this.redis.get(progressKey);

    let progress: IAchievementProgress;

    progress = existingProgress ? JSON.parse(existingProgress) : {
        userId,
        achievementId: achievement.id,
        progress: 0,
        unlocked: false,
        unlockedAt: null,
        progressData: {}
      };

    // Update progress based on achievement type
    switch (achievement.type) {
      case AchievementType.PROGRESSIVE: {
        (progress as any).progress += this.getEventContribution(achievement, eventData);
        break;
      }

      case AchievementType.COLLECTION: {
        progress = this.updateCollectionProgress(progress, achievement, eventData);
        break;
      }

      case AchievementType.SINGLE: {
        (progress as any).progress = 1;
        break;
      }
    }

    // Check if achievement is unlocked
    if ((progress as any).progress >= (achievement.requirement || 0)) {
      (progress as any).unlocked = true;
      (progress as any).unlockedAt = new Date();
    }

    // Save progress
    await this.redis.setex(progressKey, 86_400, JSON.stringify(progress)); // 24 hour TTL

    return progress;
  }

  private getEventContribution(achievement: IAchievement, eventData: any): number {
    const condition = achievement.conditions?.find((c: any) => c.eventType === eventData.type);
    return condition?.count || 1;
  }

  private updateCollectionProgress(progress: IAchievementProgress, achievement: IAchievement, eventData: any): IAchievementProgress {
    if (!progress.progressData) {
      progress = { ...progress, progressData: {} };
    }

    if (!progress.progressData!['collectedItems']) {
      progress.progressData!['collectedItems'] = [];
    }

    const collectedItems = progress.progressData!['collectedItems'] as Array<string>;
    const condition = achievement.conditions?.find((c: any) => c.type === 'collection');

    if (condition && condition.items?.includes(eventData.itemId) && !collectedItems.includes(eventData.itemId)) {
      collectedItems.push(eventData.itemId);
      // Create a new object to avoid read-only error
      return {
        ...progress,
        progress: collectedItems.length
      };
    }

    return progress;
  }

  private async notifyAchievementUnlocked(userId: string, achievement: IAchievement, progress: IAchievementProgress): Promise<void> {
    // WebSocket notification
    const notification = {
      type: 'achievement_unlocked',
      data: {
        achievement: {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity,
          points: achievement.points,
          category: achievement.category
        },
        unlockedAt: progress.unlockedAt,
        totalPoints: await this.getUserTotalPoints(userId)
      }
    };

    await this.websocketManager.sendToUser(userId, notification.type, notification.data);

    // Emit event for analytics
    this.emit('achievement_unlocked', {
      userId,
      achievementId: achievement.id,
      points: achievement.points,
      rarity: achievement.rarity,
      category: achievement.category
    });

    // Update leaderboard
    await this.updateLeaderboard(userId);
  }

  async getUserAchievements(userId: string): Promise<Array<IAchievementProgress>> {
    try {
      const pattern = `${this.USER_ACHIEVEMENTS_KEY}${userId}:*`;
      const keys = await this.redis.keys(pattern);

      const achievements: Array<IAchievementProgress> = [];

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          achievements.push(JSON.parse(data));
        }
      }

      return achievements;
    } catch (error) {
      this.logger.error('Error getting user achievements', { userId, error });
      throw new GameError(
        'Failed to get user achievements',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  async getAchievementById(achievementId: string): Promise<IAchievement | null> {
    return this.achievements.get(achievementId) || null;
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<IAchievementProgress> {
    const achievement = await this.getAchievementById(achievementId);
    if (!achievement) {
      throw new GameError(
        'Achievement not found',
        ErrorCode.RESOURCE_NOT_FOUND,
        404
      );
    }

    const progress: IAchievementProgress = {
      userId,
      achievementId,
      progress: achievement.requirement || 1,
      unlocked: true,
      unlockedAt: new Date(),
      progressData: {}
    };

    const progressKey = `${this.USER_ACHIEVEMENTS_KEY}${userId}:${achievementId}`;
    await this.redis.setex(progressKey, 86_400, JSON.stringify(progress));

    await this.notifyAchievementUnlocked(userId, achievement, progress);

    return progress;
  }

  async getLeaderboard(category?: AchievementCategory): Promise<Array<{ userId: string; points: number; achievements: number }>> {
    try {
      let leaderboardKey = this.LEADERBOARD_KEY;
      if (category) {
        leaderboardKey += `:${category}`;
      }

      const leaderboardData = await this.redis.get(leaderboardKey);

      if (leaderboardData) {
        return JSON.parse(leaderboardData);
      }

      // Generate leaderboard if not cached
      return await this.generateLeaderboard(category);
    } catch (error) {
      this.logger.error('Error getting leaderboard', { category, error });
      throw new GameError(
        'Failed to get leaderboard',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  private async generateLeaderboard(_category?: AchievementCategory): Promise<Array<{ userId: string; points: number; achievements: number }>> {
    // This is a simplified implementation
    // In a real system, you'd query a database for all users
    // const leaderboard: string[] = []; // Placeholder for actual leaderboard data

    const results: Array<{ userId: string; points: number; achievements: number }> = [];

    // For now, return empty array as we don't have real leaderboard data
    // In a real implementation, this would query user data from database
    return results;
  }

  private async getUserTotalPoints(userId: string): Promise<number> {
    const userAchievements = await this.getUserAchievements(userId);
    let totalPoints = 0;

    for (const progress of userAchievements) {
      if (progress.unlocked) {
        const achievement = this.achievements.get(progress.achievementId);
        if (achievement) {
          totalPoints += achievement.points;
        }
      }
    }

    return totalPoints;
  }

  private async updateLeaderboard(userId: string): Promise<void> {
    const totalPoints = await this.getUserTotalPoints(userId);

    // Update sorted set
    await this.redis.zadd(`${this.LEADERBOARD_KEY}:sorted`, totalPoints, userId);

    // Cache leaderboard for 5 minutes
    const leaderboard = await this.generateLeaderboard();
    await this.redis.setex(this.LEADERBOARD_KEY, 300, JSON.stringify(leaderboard));
  }
}