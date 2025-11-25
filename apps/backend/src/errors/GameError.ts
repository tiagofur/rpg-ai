import { ErrorCode } from '../types/index.js';

export class GameError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'GameError';
    Error.captureStackTrace(this, GameError);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack
    };
  }
}

export class AuthError extends GameError {
  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 401,
    details?: Record<string, any>
  ) {
    super(message, code, statusCode, details);
    this.name = 'AuthError';
  }
}

export class ValidationError extends GameError {
  constructor(
    message: string,
    public fields: Record<string, string>,
    details?: Record<string, any>
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends GameError {
  constructor(
    message: string = 'Too many requests',
    public retryAfter?: number,
    details?: Record<string, any>
  ) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, details);
    this.name = 'RateLimitError';
  }
}

export class CircuitBreakerError extends GameError {
  constructor(
    message: string = 'Service temporarily unavailable',
    public serviceName: string,
    details?: Record<string, any>
  ) {
    super(message, ErrorCode.SERVICE_UNAVAILABLE, 503, details);
    this.name = 'CircuitBreakerError';
  }
}

export class ServiceUnavailableError extends GameError {
  constructor(
    message: string = 'Service unavailable',
    public serviceName: string,
    details?: Record<string, any>
  ) {
    super(message, ErrorCode.SERVICE_UNAVAILABLE, 503, details);
    this.name = 'ServiceUnavailableError';
  }
}

// Re-export ErrorCode from types to maintain compatibility
export { ErrorCode } from '../types/index.js';