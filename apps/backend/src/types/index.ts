/* eslint-disable max-lines */
/**
 * Tipos base del sistema RPG AI Supreme
 * Estándares enterprise - Dignos de los dioses de la programación
 */

// ===== TIPOS BASE DE IDENTIDAD =====

/**
 * Identificador único universal (UUID v4)
 * @pattern ^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$
 */
export type UUID = string;

/**
 * Marca de tiempo en formato ISO 8601
 * @pattern ^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$
 */
export type ISOTimestamp = string;

/**
 * Dirección de correo electrónico válida
 * @pattern ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
 */
export type Email = string;

/**
 * Token JWT firmado
 * @pattern ^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$
 */
export type JWT = string;

/**
 * Hash de contraseña bcrypt
 * @pattern ^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$
 */
export type BcryptHash = string;

// ===== TIPOS DE SEGURIDAD Y AUTENTICACIÓN =====

/**
 * Roles de usuario con permisos jerárquicos
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  PREMIUM_USER = 'premium_user',
  USER = 'user',
  GUEST = 'guest',
}

/**
 * Estado de autenticación del usuario
 */
export enum AuthStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
}

/**
 * Proveedores de autenticación OAuth
 */
export enum OAuthProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
  GITHUB = 'github',
  DISCORD = 'discord',
}

/**
 * Tipo de token de autenticación
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  MFA = 'mfa',
}

export interface IAuthUser {
  id: UUID;
  email: string;
  username: string;
  role: UserRole;
  status: AuthStatus;
  mfaEnabled: boolean;
  mfaSecret?: string | undefined;
  lastLoginAt?: Date | undefined;
  loginAttempts: number;
  lockedUntil?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
  stripeCustomerId?: string;
}

// ===== TIPOS DE JUEGO Y SESIÓN =====

/**
 * Estado de una sesión de juego
 */
export enum GameSessionStatus {
  CREATED = 'created',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  ERROR = 'error',
}

/**
 * Tipo de acción en el juego
 */
export enum GameActionType {
  MOVE = 'move',
  ATTACK = 'attack',
  DEFEND = 'defend',
  CAST_SPELL = 'cast_spell',
  USE_ITEM = 'use_item',
  TALK = 'talk',
  EXPLORE = 'explore',
  REST = 'rest',
  TRADE = 'trade',
}

/**
 * Rareza de items y logros
 */
export enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic',
}

/**
 * Categorías de logros
 */
export enum AchievementCategory {
  COMBAT = 'combat',
  EXPLORATION = 'exploration',
  SOCIAL = 'social',
  CREATIVE = 'creative',
  SPECIAL = 'special',
  PREMIUM = 'premium',
}

// ===== TIPOS DE IA Y ANALÍTICAS =====

/**
 * Proveedores de IA soportados
 */
export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  COHERE = 'cohere',
  HUGGINGFACE = 'huggingface',
}

/**
 * Tipo de contenido generado por IA
 */
export enum AIContentType {
  DIALOG = 'dialog',
  NARRATIVE = 'narrative',
  QUEST = 'quest',
  CHARACTER = 'character',
  WORLD = 'world',
  ITEM = 'item',
}

/**
 * Estado de procesamiento de IA
 */
export enum AIProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CACHED = 'cached',
}

// ===== TIPOS DE ERRORES PERSONALIZADOS =====

/**
 * Códigos de error del sistema
 */
export enum ErrorCode {
  // Errores de autenticación
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  MFA_REQUIRED = 'MFA_REQUIRED',

  // Errores de validación
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Errores de negocio
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

  // Errores del juego
  INVALID_GAME_ACTION = 'INVALID_GAME_ACTION',
  GAME_SESSION_NOT_FOUND = 'GAME_SESSION_NOT_FOUND',
  GAME_SESSION_EXPIRED = 'GAME_SESSION_EXPIRED',
  INVALID_GAME_STATE = 'INVALID_GAME_STATE',

  // Errores de IA
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  AI_RATE_LIMIT_EXCEEDED = 'AI_RATE_LIMIT_EXCEEDED',
  AI_CONTEXT_TOO_LONG = 'AI_CONTEXT_TOO_LONG',
  AI_INVALID_RESPONSE = 'AI_INVALID_RESPONSE',
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  AI_ANALYSIS_FAILED = 'AI_ANALYSIS_FAILED',
  AI_STREAM_FAILED = 'AI_STREAM_FAILED',

  // Errores del sistema
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  QUEUE_ERROR = 'QUEUE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Errores de bloqueo de sesión (concurrencia)
  SESSION_LOCKED = 'SESSION_LOCKED',
  SESSION_LOCK_MISMATCH = 'SESSION_LOCK_MISMATCH',
  SESSION_LOCK_ERROR = 'SESSION_LOCK_ERROR',
}

/**
 * Categorías de errores para logging y monitoreo
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  BUSINESS = 'business',
  GAME_LOGIC = 'game_logic',
  AI = 'ai',
  SYSTEM = 'system',
  EXTERNAL = 'external',
}

// ===== TIPOS DE RENDIMIENTO Y MÉTRICAS =====

/**
 * Nivel de log para logging estructurado
 */
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Categorías de métricas para monitoreo
 */
export enum MetricCategory {
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  TECHNICAL = 'technical',
  USER_ENGAGEMENT = 'user_engagement',
  AI_USAGE = 'ai_usage',
  ERROR = 'error',
}

/**
 * Unidades de medida para métricas
 */
export enum MetricUnit {
  COUNT = 'count',
  PERCENTAGE = 'percentage',
  MILLISECONDS = 'milliseconds',
  SECONDS = 'seconds',
  BYTES = 'bytes',
  REQUESTS_PER_SECOND = 'requests_per_second',
}

// ===== TIPOS DE CONFIGURACIÓN =====

/**
 * Entornos de despliegue
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * Regiones de despliegue
 */
export enum Region {
  US_EAST_1 = 'us-east-1',
  US_WEST_2 = 'us-west-2',
  EU_WEST_1 = 'eu-west-1',
  EU_CENTRAL_1 = 'eu-central-1',
  AP_SOUTHEAST_1 = 'ap-southeast-1',
  AP_NORTHEAST_1 = 'ap-northeast-1',
}

// ===== INTERFACES BASE =====

/**
 * Entidad base con propiedades comunes
 */
export interface BaseEntity {
  readonly id: UUID;
  readonly createdAt: ISOTimestamp;
  readonly updatedAt: ISOTimestamp;
  readonly version: number;
}

/**
 * Entidad suavemente eliminable
 */
export interface SoftDeletableEntity extends BaseEntity {
  readonly deletedAt: ISOTimestamp | null;
  readonly isDeleted: boolean;
}

/**
 * Entidad con propietario
 */
export interface OwnableEntity {
  readonly ownerId: UUID;
  readonly ownerType: 'user' | 'system' | 'ai';
}

/**
 * Entidad auditable
 */
export interface AuditableEntity {
  readonly createdBy: UUID;
  readonly updatedBy: UUID;
  readonly deletedBy: UUID | null;
}

/**
 * Entidad con metadatos
 */
export interface MetadataEntity {
  readonly metadata: Record<string, unknown>;
  readonly tags: Array<string>;
}

// ===== TIPOS DE UTILIDAD =====

/**
 * Resultado de una operación
 */
export interface Result<T, E = Error> {
  readonly isSuccess: boolean;
  readonly isFailure: boolean;
  readonly value: T | null;
  readonly error: E | null;
}

/**
 * Paginación estándar
 */
export interface PaginationParameters {
  readonly page: number;
  readonly limit: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  readonly items: Array<T>;
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
}

/**
 * Rango de fechas
 */
export interface DateRange {
  readonly start: ISOTimestamp;
  readonly end: ISOTimestamp;
}

/**
 * Coordenadas geográficas
 */
export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

// ===== VALIDACIONES Y CONSTRAINTS =====

/**
 * Longitudes máximas para campos de texto
 */
// eslint-disable-next-line @typescript-eslint/typedef
export const TEXT_CONSTRAINTS = {
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_EMAIL_LENGTH: 5,
  MAX_EMAIL_LENGTH: 254,
  MIN_DISPLAY_NAME_LENGTH: 1,
  MAX_DISPLAY_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 0,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 200,
} as const;

/**
 * Límites numéricos
 */
// eslint-disable-next-line @typescript-eslint/typedef
export const NUMERIC_CONSTRAINTS = {
  MIN_PAGE_SIZE: 1,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 20,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB
} as const;

/**
 * Duraciones de tiempo
 */
// eslint-disable-next-line @typescript-eslint/typedef
export const TIME_CONSTRAINTS = {
  ACCESS_TOKEN_TTL: 15 * 60 * 1000, // 15 minutos
  REFRESH_TOKEN_TTL: 7 * 24 * 60 * 60 * 1000, // 7 días
  PASSWORD_RESET_TTL: 60 * 60 * 1000, // 1 hora
  EMAIL_VERIFICATION_TTL: 24 * 60 * 60 * 1000, // 24 horas
  MFA_TOKEN_TTL: 5 * 60 * 1000, // 5 minutos
  CACHE_TTL: 60 * 60 * 1000, // 1 hora
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minuto
} as const;

/**
 * Expresiones regulares de validación
 */
// eslint-disable-next-line @typescript-eslint/typedef
export const VALIDATION_PATTERNS = {
  UUID: /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
  EMAIL: /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/,
  USERNAME: /^[\w-]{3,30}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!$%&*?@])[\d!$%&*?@A-Za-z]{8,}$/,
  // eslint-disable-next-line security/detect-unsafe-regex
  JWT: /^(?:[\w-]+\.){2}[\w-]+$/,
  BCRYPT_HASH: /^\$2[aby]\$\d{2}\$[\d./A-Za-z]{53}$/,
  ISO_TIMESTAMP: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
} as const;