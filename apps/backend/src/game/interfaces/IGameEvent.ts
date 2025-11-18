import { EventEmitter } from 'events';

export interface IGameEvent {
  id: string;
  type: string;
  source: string;
  target?: string;
  data: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface IGameEventListener {
  eventType: string;
  handler: (event: IGameEvent) => Promise<void> | void;
  priority?: number;
}

export interface IGameEventService {
  emit(event: IGameEvent): Promise<void>;
  on(eventType: string, handler: (event: IGameEvent) => Promise<void> | void, priority?: number): void;
  off(eventType: string, handler: (event: IGameEvent) => Promise<void> | void): void;
  once(eventType: string, handler: (event: IGameEvent) => Promise<void> | void): void;
  getEventHistory(sessionId: string, eventTypes?: string[]): Promise<IGameEvent[]>;
  clearEventHistory(sessionId: string): Promise<void>;
}

export interface IGameEventEmitter extends EventEmitter {
  emitAsync(event: string | symbol, ...args: any[]): Promise<boolean>;
}

export interface IEventFilter {
  eventTypes?: string[];
  source?: string;
  target?: string;
  userId?: string;
  sessionId?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

export interface IEventMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySource: Record<string, number>;
  eventsByUser: Record<string, number>;
  averageProcessingTime: number;
  errorRate: number;
}