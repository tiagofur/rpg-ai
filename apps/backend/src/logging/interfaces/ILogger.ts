export interface ILogger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error | unknown, meta?: Record<string, any>): void;
  fatal(message: string, error?: Error | unknown, meta?: Record<string, any>): void;
  child(bindings: Record<string, any>): ILogger;
}

export interface ILogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
  error?: Error;
  context?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface ILoggerService {
  createLogger(name: string): ILogger;
  getLogger(name: string): ILogger;
  setGlobalLevel(level: LogLevel): void;
  addTransport(transport: ILogTransport): void;
  removeTransport(name: string): void;
  flush(): Promise<void>;
}

export interface ILogTransport {
  name: string;
  level: LogLevel;
  write(entry: ILogEntry): Promise<void>;
  close(): Promise<void>;
}

export interface ILogFormatter {
  format(entry: ILogEntry): string | Buffer;
}

export interface ILogFilter {
  shouldLog(entry: ILogEntry): boolean;
}