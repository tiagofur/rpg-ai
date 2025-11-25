import { EventEmitter } from 'node:events';
import { IAnalyticsEvent, IAnalyticsService as IAnalyticsServiceInterface, IAnalyticsMetric, ITimeRange, IUserAnalytics, IRealTimeMetrics } from '../interfaces/IAnalytics.js';
import { GameError, ErrorCode } from '../errors/GameError.js';
import { ILogger } from '../logging/interfaces/ILogger.js';
import { IRedisClient } from '../cache/interfaces/IRedisClient.js';

export interface IKafkaProducer {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(parameters: { topic: string; messages: Array<{ key?: string; value: string }> }): Promise<void>;
}

export interface IPlayerSession {
  sessionId: string;
  playerId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  gameMode: string;
  level: number;
  experienceGained: number;
  achievements: Array<string>;
  questsCompleted: Array<string>;
  contentAccessed?: Array<string>;
  battles: Array<{
    battleId: string;
    opponent: string;
    result: 'win' | 'loss' | 'draw';
    timestamp: string;
  }>;
}

export interface IAnalyticsService extends IAnalyticsServiceInterface {
  trackPlayerSession(session: any): Promise<void>;
  getMetrics(metricName: string, timeRange: ITimeRange): Promise<Array<IAnalyticsMetric>>;
  getUserAnalytics(playerId: string, timeRange: ITimeRange): Promise<IUserAnalytics>;
  getGameMetrics(timeRange: ITimeRange): Promise<IRealTimeMetrics>;
  getRealTimeMetrics(): Promise<IRealTimeMetrics>;
  generatePlayerInsights(playerId: string): Promise<Record<string, any>>;
  exportData(format: 'json' | 'csv' | 'parquet'): Promise<Buffer>;
}

export class AnalyticsService extends EventEmitter implements IAnalyticsService {
  private readonly ANALYTICS_TOPIC = 'game-analytics';

  private readonly PLAYER_SESSIONS_TOPIC = 'player-sessions';

  private readonly REAL_TIME_METRICS_KEY = 'analytics:realtime';

  private readonly PLAYER_INSIGHTS_KEY = 'analytics:insights:';

  private metricsBuffer: Array<IAnalyticsEvent> = [];

  private bufferFlushInterval: NodeJS.Timeout | null = null;

  private readonly BUFFER_SIZE = 100;

  private readonly FLUSH_INTERVAL_MS = 5000;

  constructor(
    private readonly kafkaProducer: IKafkaProducer,
    private readonly redis: IRedisClient,
    private readonly logger: ILogger
  ) {
    super();
    this.startBufferFlushTimer();
  }

  async initialize(): Promise<void> {
    try {
      await this.kafkaProducer.connect();
      this.logger.info('Analytics service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize analytics service', { error });
      throw new GameError(
        'Failed to initialize analytics service',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  async trackEvent(event: IAnalyticsEvent): Promise<void> {
    try {
      // Validate event
      this.validateEvent(event);

      // Add timestamp if not present
      if (!event.timestamp) {
        event.timestamp = new Date();
      }

      // Add to buffer for batch processing
      this.metricsBuffer.push(event);

      // Update real-time metrics
      await this.updateRealTimeMetrics(event);

      // Flush buffer if it's full
      if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
        await this.flushBuffer();
      }

      // Emit event for real-time processing
      this.emit('analytics_event', event);
    } catch (error) {
      this.logger.error('Error tracking analytics event', { event, error });
      throw new GameError(
        'Failed to track analytics event',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  async trackPlayerSession(session: any): Promise<void> {
    try {
      // Validate session data
      if (!session.playerId || !session.sessionId || !session.startTime) {
        throw new Error('Session must have playerId, sessionId, and startTime');
      }

      // Send to Kafka for processing
      await this.kafkaProducer.send({
        topic: this.PLAYER_SESSIONS_TOPIC,
        messages: [{
          key: session.playerId,
          value: JSON.stringify(session)
        }]
      });

      // Cache session data for real-time access
      const sessionKey = `session:${session.sessionId}`;
      await this.redis.setex(sessionKey, 3600, JSON.stringify(session)); // 1 hour TTL

      // Update player insights
      await this.updatePlayerInsights(session.playerId, session as IPlayerSession);

      this.logger.debug('Player session tracked', { playerId: session.playerId, sessionId: session.sessionId });
    } catch (error) {
      this.logger.error('Error tracking player session', { session, error });
      throw new GameError(
        'Failed to track player session',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  async getMetrics(_metricName: string, _timeRange: ITimeRange): Promise<Array<IAnalyticsMetric>> {
    // Stub implementation
    return [];
  }

  async getUserAnalytics(playerId: string, timeRange: ITimeRange): Promise<IUserAnalytics> {
    try {
      // Get sessions from cache first
      const sessionPattern = `session:*:player:${playerId}`;
      const sessionKeys = await this.redis.keys(sessionPattern);

      const sessions: Array<IPlayerSession> = [];

      for (const key of sessionKeys) {
        const sessionData = await this.redis.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData) as IPlayerSession;
          const sessionStart = new Date(session.startTime);

          if (sessionStart >= timeRange.start && sessionStart <= timeRange.end) {
            sessions.push(session);
          }
        }
      }

      // Sort by start time
      sessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      // Convert to IUserAnalytics format
      return {
        userId: playerId,
        totalSessions: sessions.length,
        totalPlayTime: sessions.reduce((total, session) => total + (session.duration || 0), 0),
        averageSessionDuration: sessions.length > 0 ? sessions.reduce((total, session) => total + (session.duration || 0), 0) / sessions.length : 0,
        achievementsUnlocked: sessions.reduce((total, session) => total + session.achievements.length, 0),
        questsCompleted: sessions.reduce((total, session) => total + session.questsCompleted.length, 0),
        battlesWon: sessions.reduce((total, session) => total + session.battles.filter(b => b.result === 'win').length, 0),
        battlesLost: sessions.reduce((total, session) => total + session.battles.filter(b => b.result === 'loss').length, 0),
        levelProgression: [], // TODO: Implement level progression tracking
        dailyActivity: [] // TODO: Implement daily activity tracking
      };
    } catch (error) {
      this.logger.error('Error getting player analytics', { playerId, timeRange, error });
      throw new GameError(
        'Failed to get player analytics',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  async getGameMetrics(timeRange: ITimeRange): Promise<IRealTimeMetrics> {
    try {
      // This would typically query a time-series database or aggregated data store
      // For now, we'll calculate from recent events
      const metrics = await this.calculateMetrics(timeRange);

      return {
        activeUsers: metrics.activePlayers || 0,
        activeGames: metrics.totalSessions || 0,
        serverLoad: 0.5, // Default value
        memoryUsage: 0, // Default value
        responseTime: 0, // Default value
        errorRate: 0 // Default value
      };
    } catch (error) {
      this.logger.error('Error getting game metrics', { timeRange, error });
      throw new GameError(
        'Failed to get game metrics',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  async getRealTimeMetrics(): Promise<IRealTimeMetrics> {
    try {
      const cachedMetrics = await this.redis.get(this.REAL_TIME_METRICS_KEY);

      if (cachedMetrics) {
        return JSON.parse(cachedMetrics);
      }

      // Calculate real-time metrics
      const lastHour = new Date(Date.now() - 3_600_000); // 1 hour ago
      const now = new Date();

      const metrics = await this.calculateMetrics({ start: lastHour, end: now });

      const realTimeMetrics: IRealTimeMetrics = {
        activeUsers: metrics.activePlayers || 0,
        activeGames: metrics.totalSessions || 0,
        serverLoad: 0.5,
        memoryUsage: 0,
        responseTime: 0,
        errorRate: 0
      };

      // Cache for 5 minutes
      await this.redis.setex(this.REAL_TIME_METRICS_KEY, 300, JSON.stringify(realTimeMetrics));

      return realTimeMetrics;
    } catch (error) {
      this.logger.error('Error getting real-time metrics', { error });
      throw new GameError(
        'Failed to get real-time metrics',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  async generatePlayerInsights(playerId: string): Promise<any> {
    try {
      const insightsKey = `${this.PLAYER_INSIGHTS_KEY}${playerId}`;
      const cachedInsights = await this.redis.get(insightsKey);

      if (cachedInsights) {
        return JSON.parse(cachedInsights);
      }

      // Generate insights based on player data
      const insights = await this.calculatePlayerInsights(playerId);

      // Cache for 1 hour
      await this.redis.setex(insightsKey, 3600, JSON.stringify(insights));

      return insights;
    } catch (error) {
      this.logger.error('Error generating player insights', { playerId, error });
      throw new GameError(
        'Failed to generate player insights',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  async exportData(format: 'json' | 'csv' | 'parquet'): Promise<Buffer> {
    try {
      // Get recent analytics data
      const last24Hours = new Date(Date.now() - 86_400_000);
      const now = new Date();

      const timeRange: ITimeRange = { start: last24Hours, end: now };
      const metrics = await this.getGameMetrics(timeRange);

      switch (format) {
        case 'json': {
          return Buffer.from(JSON.stringify(metrics, null, 2));
        }

        case 'csv': {
          return this.convertToCSV(metrics);
        }

        case 'parquet': {
          // For parquet, we'd need a specialized library
          // For now, return JSON as placeholder
          return Buffer.from(JSON.stringify(metrics));
        }

        default: {
          throw new Error(`Unsupported export format: ${format}`);
        }
      }
    } catch (error) {
      this.logger.error('Error exporting analytics', { format, error });
      throw new GameError(
        'Failed to export analytics',
        ErrorCode.INTERNAL_SERVER_ERROR,
        500
      );
    }
  }

  private validateEvent(event: IAnalyticsEvent): void {
    if (!event.eventType || !event.userId) {
      throw new Error('Event must have eventType and userId');
    }
  }



  private async updateRealTimeMetrics(event: IAnalyticsEvent): Promise<void> {
    const metrics = await this.getRealTimeMetrics();

    // Update metrics based on event type
    switch (event.eventType) {
      case 'player_login': {
        metrics.activeUsers = (metrics.activeUsers || 0) + 1;
        break;
      }

      case 'player_logout': {
        metrics.activeUsers = Math.max(0, (metrics.activeUsers || 0) - 1);
        break;
      }

      case 'session_start': {
        metrics.activeGames = (metrics.activeGames || 0) + 1;
        break;
      }

      case 'session_end': {
        metrics.activeGames = Math.max(0, (metrics.activeGames || 0) - 1);
        break;
      }
    }

    // Save updated metrics
    await this.redis.setex(this.REAL_TIME_METRICS_KEY, 300, JSON.stringify(metrics));
  }

  private async updatePlayerInsights(playerId: string, session: IPlayerSession): Promise<void> {
    const insightsKey = `${this.PLAYER_INSIGHTS_KEY}${playerId}`;
    const existingInsights = await this.redis.get(insightsKey);

    let insights: any = {};
    if (existingInsights) {
      insights = JSON.parse(existingInsights);
    }

    // Update insights based on session data
    insights.totalPlaytime = (insights.totalPlaytime || 0) + (session.duration || 0);
    insights.totalSessions = (insights.totalSessions || 0) + 1;
    insights.lastSession = session.endTime || new Date().toISOString();
    insights.favoriteContent = this.updateFavoriteContent(insights.favoriteContent, session.contentAccessed || []);

    // Cache updated insights
    await this.redis.setex(insightsKey, 3600, JSON.stringify(insights));
  }

  private updateFavoriteContent(existingFavorites: any = {}, contentAccessed: Array<string> = []): any {
    if (!existingFavorites) existingFavorites = {};

    for (const content of contentAccessed) {
      existingFavorites[content] = (existingFavorites[content] || 0) + 1;
    }

    return existingFavorites;
  }

  private async calculateMetrics(_timeRange: ITimeRange): Promise<any> {
    // This is a simplified implementation
    // In a real system, you'd query aggregated data from a time-series database

    return {
      totalPlayers: Math.floor(Math.random() * 10_000) + 1000,
      activePlayers: Math.floor(Math.random() * 2000) + 500,
      newPlayers: Math.floor(Math.random() * 100) + 20,
      returningPlayers: Math.floor(Math.random() * 500) + 100,
      totalSessions: Math.floor(Math.random() * 5000) + 1000,
      averageSessionDuration: Math.floor(Math.random() * 3600) + 600, // 10-70 minutes
      playerRetention: {
        day1: Math.random() * 0.3 + 0.4, // 40-70%
        day7: Math.random() * 0.2 + 0.2,  // 20-40%
        day30: Math.random() * 0.1 + 0.1   // 10-20%
      },
      revenue: Math.random() * 10_000 + 1000,
      topContent: [
        { contentId: 'quest_001', name: 'First Quest', visits: Math.floor(Math.random() * 1000) + 100 },
        { contentId: 'dungeon_001', name: 'Starter Dungeon', visits: Math.floor(Math.random() * 800) + 50 }
      ],
      playerSegments: {
        casual: Math.floor(Math.random() * 1000) + 200,
        regular: Math.floor(Math.random() * 500) + 100,
        hardcore: Math.floor(Math.random() * 100) + 20
      },
      timestamp: new Date()
    };
  }

  private async calculatePlayerInsights(playerId: string): Promise<Record<string, any>> {
    // Get player's recent sessions
    const last30Days = new Date(Date.now() - 2_592_000_000); // 30 days ago
    const now = new Date();

    const timeRange: ITimeRange = { start: last30Days, end: now };
    const userAnalytics = await this.getUserAnalytics(playerId, timeRange);

    if (userAnalytics.totalSessions === 0) {
      return {
        playerId,
        totalPlaytime: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        favoriteContent: {},
        playerType: 'new',
        engagementLevel: 'low'
      };
    }

    const totalPlaytime = userAnalytics.totalPlayTime;
    const {averageSessionDuration} = userAnalytics;

    // Determine player type based on behavior
    let playerType = 'casual';
    let engagementLevel = 'low';

    if (averageSessionDuration > 3600) { // > 1 hour average
      playerType = 'hardcore';
      engagementLevel = 'high';
    } else if (averageSessionDuration > 1800) { // > 30 minutes average
      playerType = 'regular';
      engagementLevel = 'medium';
    }

    return {
      playerId,
      totalPlaytime,
      totalSessions: userAnalytics.totalSessions,
      averageSessionDuration,
      favoriteContent: {}, // Would be calculated from session data
      playerType,
      engagementLevel,
      lastActive: null // Would be calculated from session data
    };
  }

  private convertToCSV(metrics: any): Buffer {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Players', metrics.totalPlayers.toString()],
      ['Active Players', metrics.activePlayers.toString()],
      ['New Players', metrics.newPlayers.toString()],
      ['Returning Players', metrics.returningPlayers.toString()],
      ['Total Sessions', metrics.totalSessions.toString()],
      ['Average Session Duration', metrics.averageSessionDuration.toString()],
      ['Revenue', metrics.revenue.toString()]
    ];

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    return Buffer.from(csvContent);
  }

  private startBufferFlushTimer(): void {
    this.bufferFlushInterval = setInterval(async () => {
      if (this.metricsBuffer.length > 0) {
        await this.flushBuffer();
      }
    }, this.FLUSH_INTERVAL_MS) as any;
  }

  private async flushBuffer(): Promise<void> {
    if (this.metricsBuffer.length === 0) {
      return;
    }

    const eventsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      // Send to Kafka
      const messages = eventsToFlush.map(event => ({
        key: event.userId,
        value: JSON.stringify(event),
        timestamp: (event.timestamp || new Date()).toISOString()
      }));

      await this.kafkaProducer.send({
        topic: this.ANALYTICS_TOPIC,
        messages
      });

      this.logger.debug(`Flushed ${eventsToFlush.length} analytics events to Kafka`);
    } catch (error) {
      this.logger.error('Error flushing analytics buffer', { error });
      // Re-add events to buffer for retry
      this.metricsBuffer.unshift(...eventsToFlush);

      // If buffer is too large, drop oldest events
      if (this.metricsBuffer.length > this.BUFFER_SIZE * 2) {
        this.metricsBuffer = this.metricsBuffer.slice(-this.BUFFER_SIZE);
      }
    }
  }

  destroy(): void {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
      this.bufferFlushInterval = null;
    }

    // Flush remaining events
    if (this.metricsBuffer.length > 0) {
      this.flushBuffer().catch(error => {
        this.logger.error('Error flushing remaining events on destroy', { error });
      });
    }
  }
}