/**
 * Módulo de Logging - Exportaciones centralizadas
 */

// Interfaces
import { ILogger } from './interfaces/ILogger.js';
import { ConsoleLogger } from './ConsoleLogger.js';
import { ProductionLogger, createLoggingConfig } from './ProductionLogger.js';

export {
    ILogger,
    ILogEntry,
    LogLevel,
    ILoggerService,
    ILogTransport,
    ILogFormatter,
    ILogFilter
} from './interfaces/ILogger.js';

// Implementaciones
export { ConsoleLogger } from './ConsoleLogger.js';
export {
    ProductionLogger,
    ProductionLoggerConfig,
    LoggerFactory,
    createLoggingConfig
} from './ProductionLogger.js';

/**
 * Crea un logger apropiado para el entorno actual
 * - Producción: JSON estructurado (ProductionLogger)
 * - Desarrollo: Console con colores (ConsoleLogger)
 */
export function createLogger(context: string, env?: string): ILogger {
    const environment = env ?? (process.env as Record<string, string>)['NODE_ENV'] ?? 'development';

    if (environment === 'production') {
        const config = createLoggingConfig(environment);
        return new ProductionLogger(context, config);
    }

    return new ConsoleLogger(context);
}
