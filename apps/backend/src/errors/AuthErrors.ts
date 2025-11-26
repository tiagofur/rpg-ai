import { ErrorCode } from '../types/index.js';

export class AuthError extends Error {
    constructor(
        message: string,
        public code: ErrorCode,
        public statusCode: number = 401
    ) {
        super(message);
        this.name = 'AuthError';
    }
}

export class InvalidCredentialsError extends AuthError {
    constructor(message: string = 'Invalid credentials') {
        super(message, ErrorCode.INVALID_CREDENTIALS);
    }
}

export class AccountLockedError extends AuthError {
    constructor(lockedUntil: Date) {
        super(
            `Account locked until ${lockedUntil.toISOString()}`,
            ErrorCode.ACCOUNT_SUSPENDED,
            423
        );
    }
}

export class MFARequiredError extends AuthError {
    constructor(message: string = 'Multi-factor authentication required') {
        super(message, ErrorCode.MFA_REQUIRED, 403);
    }
}

export class TokenExpiredError extends AuthError {
    constructor(message: string = 'Token has expired') {
        super(message, ErrorCode.TOKEN_EXPIRED);
    }
}
