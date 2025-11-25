import { ErrorCode } from '../types/index.js';



export class AppError extends Error {
    public readonly code: ErrorCode;

    public readonly statusCode: number;

    public readonly isOperational: boolean;

    constructor(message: string, code: ErrorCode, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

export {ErrorCode} from '../types/index.js';