export interface IAnalyticsEvent {
  id?: string;
  userId: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp?: Date;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface IAnalyticsMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface IAnalyticsService {
  trackEvent(event: IAnalyticsEvent): Promise<void>;
  getMetrics(metricName: string, timeRange: ITimeRange): Promise<IAnalyticsMetric[]>;
  getUserAnalytics(userId: string, timeRange: ITimeRange): Promise<IUserAnalytics>;
  exportData(format: 'json' | 'csv' | 'parquet'): Promise<Buffer>;
}

export interface ITimeRange {
  start: Date;
  end: Date;
}

export interface IUserAnalytics {
  userId: string;
  totalSessions: number;
  totalPlayTime: number;
  averageSessionDuration: number;
  achievementsUnlocked: number;
  questsCompleted: number;
  battlesWon: number;
  battlesLost: number;
  levelProgression: ILevelProgression[];
  dailyActivity: IDailyActivity[];
}

export interface ILevelProgression {
  level: number;
  timestamp: Date;
  experienceGained: number;
}

export interface IDailyActivity {
  date: Date;
  sessionsCount: number;
  totalDuration: number;
  achievements: number;
  questsCompleted: number;
}

export interface IRealTimeMetrics {
  activeUsers: number;
  activeGames: number;
  serverLoad: number;
  memoryUsage: number;
  responseTime: number;
  errorRate: number;
}