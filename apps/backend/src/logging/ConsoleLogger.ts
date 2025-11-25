import { ILogger } from './interfaces/ILogger.js';

export class ConsoleLogger implements ILogger {
    constructor(private readonly context: string = 'App') { }

    debug(message: string, meta?: Record<string, any>): void {
        console.debug(`[DEBUG] [${this.context}] ${message}`, meta || '');
    }

    info(message: string, meta?: Record<string, any>): void {
        console.info(`[INFO] [${this.context}] ${message}`, meta || '');
    }

    warn(message: string, meta?: Record<string, any>): void {
        console.warn(`[WARN] [${this.context}] ${message}`, meta || '');
    }

    error(message: string, error?: Error | unknown, meta?: Record<string, any>): void {
        console.error(`[ERROR] [${this.context}] ${message}`, error || '', meta || '');
    }

    fatal(message: string, error?: Error | unknown, meta?: Record<string, any>): void {
        console.error(`[FATAL] [${this.context}] ${message}`, error || '', meta || '');
    }

    child(bindings: Record<string, any>): ILogger {
        return new ConsoleLogger(`${this.context}:${JSON.stringify(bindings)}`);
    }
}
