/**
 * B-031: Logging Estructurado para Producción
 * Logger que emite JSON estructurado para integración con sistemas de logging
 * (ELK Stack, Datadog, CloudWatch, etc.)
 */
import { ILogger, LogLevel } from './interfaces/ILogger.js';

export interface ProductionLoggerConfig {
    /** Nombre del servicio (aparece en todos los logs) */
    serviceName: string;

    /** Nivel mínimo de log */
    level?: LogLevel;

    /** Incluir stack traces en errores */
    includeStackTrace?: boolean;

    /** Agregar timestamp ISO */
    includeTimestamp?: boolean;

    /** Función custom para output (default: console) */
    output?: (json: string) => void;

    /** Datos adicionales para incluir en todos los logs */
    defaultMeta?: Record<string, unknown>;
}

interface StructuredLogEntry {
    timestamp?: string;
    level: string;
    service: string;
    context: string;
    message: string;
    meta?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    [key: string]: unknown;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
    [LogLevel.FATAL]: 4,
};

export class ProductionLogger implements ILogger {
    private readonly config: Required<ProductionLoggerConfig>;

    private readonly context: string;

    private readonly bindings: Record<string, unknown>;

    constructor(
        context: string = 'App',
        config: ProductionLoggerConfig,
        bindings: Record<string, unknown> = {}
    ) {
        this.context = context;
        this.bindings = bindings;
        this.config = {
            serviceName: config.serviceName,
            level: config.level ?? LogLevel.INFO,
            includeStackTrace: config.includeStackTrace ?? true,
            includeTimestamp: config.includeTimestamp ?? true,
            // eslint-disable-next-line no-console
            output: config.output ?? ((json: string) => { process.stdout.write(`${json}\n`); }),
            defaultMeta: config.defaultMeta ?? {},
        };
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
    }

    private formatError(error: Error | unknown): StructuredLogEntry['error'] | undefined {
        if (!error) return undefined;

        if (error instanceof Error) {
            const result: StructuredLogEntry['error'] = {
                name: error.name,
                message: error.message,
            };
            if (this.config.includeStackTrace && error.stack) {
                result.stack = error.stack;
            }
            return result;
        }

        return {
            name: 'UnknownError',
            message: String(error),
        };
    }

    private log(
        level: LogLevel,
        message: string,
        meta?: Record<string, unknown>,
        error?: Error | unknown
    ): void {
        if (!this.shouldLog(level)) return;

        const entry: StructuredLogEntry = {
            level: level.toUpperCase(),
            service: this.config.serviceName,
            context: this.context,
            message,
            ...this.config.defaultMeta,
            ...this.bindings,
        };

        if (this.config.includeTimestamp) {
            entry.timestamp = new Date().toISOString();
        }

        if (meta && Object.keys(meta).length > 0) {
            entry.meta = meta;
        }

        const formattedError = this.formatError(error);
        if (formattedError) {
            entry.error = formattedError;
        }

        try {
            this.config.output(JSON.stringify(entry));
        } catch {
            // Fallback for circular references
            // eslint-disable-next-line no-console
            process.stderr.write(`[ProductionLogger] Failed to stringify log entry: ${message}\n`);
        }
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        this.log(LogLevel.DEBUG, message, meta);
    }

    info(message: string, meta?: Record<string, unknown>): void {
        this.log(LogLevel.INFO, message, meta);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        this.log(LogLevel.WARN, message, meta);
    }

    error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
        this.log(LogLevel.ERROR, message, meta, error);
    }

    fatal(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
        this.log(LogLevel.FATAL, message, meta, error);
    }

    child(bindings: Record<string, unknown>): ILogger {
        return new ProductionLogger(
            this.context,
            this.config,
            { ...this.bindings, ...bindings }
        );
    }

    /**
     * Crea un logger hijo con un nuevo contexto
     */
    withContext(context: string): ProductionLogger {
        return new ProductionLogger(
            `${this.context}:${context}`,
            this.config,
            this.bindings
        );
    }
}

/**
 * Factory para crear loggers de producción
 */
export class LoggerFactory {
    private static instance: LoggerFactory;

    private readonly config: ProductionLoggerConfig;

    private readonly loggers: Map<string, ProductionLogger> = new Map();

    private constructor(config: ProductionLoggerConfig) {
        this.config = config;
    }

    static initialize(config: ProductionLoggerConfig): LoggerFactory {
        if (!LoggerFactory.instance) {
            LoggerFactory.instance = new LoggerFactory(config);
        }
        return LoggerFactory.instance;
    }

    static getInstance(): LoggerFactory {
        if (!LoggerFactory.instance) {
            throw new Error('LoggerFactory not initialized. Call initialize() first.');
        }
        return LoggerFactory.instance;
    }

    createLogger(context: string, bindings?: Record<string, unknown>): ProductionLogger {
        const key = `${context}:${JSON.stringify(bindings || {})}`;

        let logger = this.loggers.get(key);
        if (!logger) {
            logger = new ProductionLogger(context, this.config, bindings);
            this.loggers.set(key, logger);
        }

        return logger;
    }

    /**
     * Crea un logger para requests HTTP
     */
    createRequestLogger(requestId: string, userId?: string): ProductionLogger {
        return this.createLogger('HTTP', {
            requestId,
            ...(userId ? { userId } : {}),
        });
    }

    /**
     * Crea un logger para operaciones de base de datos
     */
    createDatabaseLogger(operation: string): ProductionLogger {
        return this.createLogger('Database', { operation });
    }

    /**
     * Crea un logger para servicios de AI
     */
    createAILogger(model: string): ProductionLogger {
        return this.createLogger('AI', { model });
    }

    /**
     * Crea un logger para WebSocket events
     */
    createWebSocketLogger(sessionId: string, userId?: string): ProductionLogger {
        return this.createLogger('WebSocket', {
            sessionId,
            ...(userId ? { userId } : {}),
        });
    }
}

/**
 * Crea la configuración de logging según el entorno
 */
export function createLoggingConfig(env: string): ProductionLoggerConfig {
    const isProduction = env === 'production';

    return {
        serviceName: 'rpg-ai-backend',
        level: isProduction ? LogLevel.INFO : LogLevel.DEBUG,
        includeStackTrace: !isProduction, // Solo stack traces en desarrollo
        includeTimestamp: true,
        defaultMeta: {
            environment: env,
            nodeVersion: process.version,
        },
    };
}
