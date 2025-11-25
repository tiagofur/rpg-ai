import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { randomBytes } from 'node:crypto';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../repositories/UserRepository.js';
import { GameError as AppError } from '../errors/GameError.js';
import {
  AuthError,
  InvalidCredentialsError,
  AccountLockedError,
  TokenExpiredError
} from '../errors/AuthErrors.js';
import {
  UUID,
  JWT,
  UserRole,
  AuthStatus,
  TokenType,
  TIME_CONSTRAINTS,
  ErrorCode,
  TEXT_CONSTRAINTS,
  IAuthUser
} from '../types/index.js';

export interface ITokenPayload {
  userId: UUID;
  email: string;
  username: string;
  role: UserRole;
  sessionId: string;
  deviceId: string;
  iat: number;
  exp: number;
}

export interface IRefreshTokenPayload {
  userId: UUID;
  sessionId: string;
  deviceId: string;
  iat: number;
  exp: number;
}

export interface IAuthConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  redis: Redis;
  bcryptRounds: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  mfaIssuer: string;
}

export interface ILoginAttempt {
  count: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

export interface IMfaSetup {
  secret: string;
  qrCode: string;
  backupCodes: Array<string>;
}

export interface ILoginResult {
  user: IAuthUser;
  accessToken: JWT;
  refreshToken: JWT;
  requiresMFA: boolean;
}

export interface ISessionData {
  userId: UUID;
  deviceId: string;
  createdAt: string;
}

export interface ITemporaryMfaData {
  secret: string;
  backupCodes: Array<string>;
}

// Servicio de autenticación
export class AuthenticationService {
  private readonly config: IAuthConfig;

  private readonly redis: Redis;

  public userRepository: UserRepository;

  public constructor(config: IAuthConfig, prisma: PrismaClient) {
    this.config = config;
    this.redis = config.redis;
    this.userRepository = new UserRepository(prisma);

    // Configurar otplib
    authenticator.options = {
      step: 30,
      window: 1,
      digits: 6,
      // @ts-expect-error - algorithm type mismatch in library definitions
      algorithm: 'sha1'
    };
  }

  // Métodos de autenticación
  public async register(email: string, username: string, password: string): Promise<IAuthUser> {
    // Validar entrada
    this.validateEmail(email);
    this.validateUsername(username);
    this.validatePassword(password);

    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new AuthError('Email already registered', ErrorCode.RESOURCE_CONFLICT, 409);
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, this.config.bcryptRounds);

    // Crear usuario
    const user = await this.userRepository.create({
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      role: UserRole.USER,
      status: AuthStatus.PENDING_VERIFICATION
    });

    // Generar token de verificación de email
    const verificationToken = await this.generateToken(
      { userId: user.id, type: TokenType.EMAIL_VERIFICATION },
      TIME_CONSTRAINTS.EMAIL_VERIFICATION_TTL
    );

    // Enviar email de verificación (aquí iría la integración con servicio de email)
    await this.sendVerificationEmail(email, verificationToken);

    return user;
  }

  public async login(email: string, password: string, mfaToken?: string, deviceId?: string): Promise<ILoginResult> {
    const user = await this.userRepository.findByEmail(email.toLowerCase());

    if (!user) {
      throw new InvalidCredentialsError();
    }

    this.checkAccountStatus(user);

    // Verificar contraseña
    const passwordHash = await this.userRepository.getPasswordHash(user.id);
    const isPasswordValid = await bcrypt.compare(password, passwordHash || '');

    if (!isPasswordValid) {
      await this.recordFailedLogin(user);
      throw new InvalidCredentialsError();
    }

    // Verificar MFA si está habilitado
    if (user.mfaEnabled) {
      if (!mfaToken) {
        return {
          user,
          accessToken: '' as JWT,
          refreshToken: '' as JWT,
          requiresMFA: true
        };
      }

      const isMFATokenValid = await this.verifyMFAToken(user.mfaSecret!, mfaToken);
      if (!isMFATokenValid) {
        await this.recordFailedLogin(user);
        throw new AuthError('Invalid MFA token', ErrorCode.INVALID_CREDENTIALS);
      }
    }

    // Resetear intentos de login fallidos
    await this.resetLoginAttempts(user);

    return this.createSession(user, deviceId);
  }

  private checkAccountStatus(user: IAuthUser): void {
    // Verificar si la cuenta está bloqueada
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AccountLockedError(user.lockedUntil);
    }

    // Verificar estado de la cuenta
    if (user.status !== AuthStatus.ACTIVE) {
      throw new AuthError('Account is not active', ErrorCode.ACCOUNT_SUSPENDED);
    }
  }

  private async createSession(user: IAuthUser, deviceId?: string): Promise<ILoginResult> {
    // Generar tokens
    const sessionId = this.generateUUID();
    const deviceIdentifier = deviceId || this.generateDeviceId();

    const accessToken = await this.generateAccessToken(user, sessionId, deviceIdentifier);
    const refreshToken = await this.generateRefreshToken(user, sessionId, deviceIdentifier);

    // Actualizar último login
    await this.userRepository.updateLastLogin(user.id);

    // Guardar sesión en Redis
    await this.saveSession(sessionId, user.id, deviceIdentifier);

    return {
      user,
      accessToken,
      refreshToken,
      requiresMFA: false
    };
  }

  public async logout(_userId: UUID, sessionId: string): Promise<void> {
    // Invalidar tokens
    await this.invalidateSession(sessionId);
  }

  public async refreshToken(refreshToken: JWT): Promise<{
    accessToken: JWT;
    refreshToken: JWT;
  }> {
    try {
      const payload = jwt.verify(refreshToken, this.config.jwtRefreshSecret) as IRefreshTokenPayload;

      // Verificar que la sesión aún sea válida
      const session = await this.getSession(payload.sessionId);
      if (!session || session.userId !== payload.userId) {
        throw new TokenExpiredError();
      }

      // Obtener usuario actualizado
      const user = await this.findUserById(payload.userId);
      if (!user || user.status !== AuthStatus.ACTIVE) {
        throw new TokenExpiredError();
      }

      // Generar nuevos tokens
      const newAccessToken = await this.generateAccessToken(user, payload.sessionId, payload.deviceId);
      const newRefreshToken = await this.generateRefreshToken(user, payload.sessionId, payload.deviceId);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError();
      }
      throw new AuthError('Invalid refresh token', ErrorCode.INVALID_TOKEN);
    }
  }

  // Métodos MFA
  public async setupMFA(userId: UUID): Promise<IMfaSetup> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthError('User not found', ErrorCode.RESOURCE_NOT_FOUND);
    }

    // Generar secreto MFA
    const secret = authenticator.generateSecret();

    // Generar QR code
    const otpauth = authenticator.keyuri(user.email, this.config.mfaIssuer, secret);
    const qrCode = await qrcode.toDataURL(otpauth);

    // Generar códigos de respaldo
    const backupCodes = this.generateBackupCodes();

    // Guardar secreto temporalmente (no habilitar MFA hasta verificación)
    await this.saveTemporaryMFASecret(userId, secret, backupCodes);

    return {
      secret,
      qrCode,
      backupCodes
    };
  }

  public async enableMFA(userId: UUID, token: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthError('User not found', ErrorCode.RESOURCE_NOT_FOUND);
    }

    // Obtener secreto temporal
    const temporaryData = await this.getTemporaryMFASecret(userId);
    if (!temporaryData) {
      throw new AuthError('No MFA setup in progress', ErrorCode.OPERATION_NOT_ALLOWED);
    }

    // Verificar token
    const isValid = await this.verifyMFAToken(temporaryData.secret, token);
    if (!isValid) {
      throw new AuthError('Invalid MFA token', ErrorCode.INVALID_CREDENTIALS);
    }

    // Habilitar MFA
    await this.userRepository.enableMFA(userId, temporaryData.secret, temporaryData.backupCodes);
    await this.clearTemporaryMFASecret(userId);
  }

  public async disableMFA(userId: UUID, password: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthError('User not found', ErrorCode.RESOURCE_NOT_FOUND);
    }

    if (!user.mfaEnabled) {
      throw new AuthError('MFA is not enabled', ErrorCode.OPERATION_NOT_ALLOWED);
    }

    // Verificar contraseña
    const passwordHash = await this.userRepository.getPasswordHash(userId);
    const isPasswordValid = await bcrypt.compare(password, passwordHash || '');
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Deshabilitar MFA
    await this.userRepository.disableMFA(userId);
  }

  public async verifyMFAToken(secret: string, token: string): Promise<boolean> {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }

  // Métodos de token
  public async generateAccessToken(user: IAuthUser, sessionId: string, deviceId: string): Promise<JWT> {
    const payload: ITokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      sessionId,
      deviceId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (TIME_CONSTRAINTS.ACCESS_TOKEN_TTL / 1000)
    };

    return jwt.sign(payload, this.config.jwtSecret);
  }

  public async generateRefreshToken(user: IAuthUser, sessionId: string, deviceId: string): Promise<JWT> {
    const payload: IRefreshTokenPayload = {
      userId: user.id,
      sessionId,
      deviceId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (TIME_CONSTRAINTS.REFRESH_TOKEN_TTL / 1000)
    };

    return jwt.sign(payload, this.config.jwtRefreshSecret);
  }

  public async generateToken(payload: Record<string, unknown>, ttl: number): Promise<JWT> {
    const tokenPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (ttl / 1000)
    };

    return jwt.sign(tokenPayload, this.config.jwtSecret);
  }

  public async verifyToken(token: JWT): Promise<ITokenPayload> {
    try {
      return jwt.verify(token, this.config.jwtSecret) as ITokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError();
      }
      throw new AuthError('Invalid token', ErrorCode.INVALID_TOKEN);
    }
  }

  // Métodos de validación
  private validateEmail(email: string): void {
    const emailRegex = /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new AuthError('Invalid email format', ErrorCode.INVALID_INPUT);
    }
    if (email.length > TEXT_CONSTRAINTS.MAX_EMAIL_LENGTH) {
      throw new AuthError('Email too long', ErrorCode.INVALID_INPUT);
    }
  }

  private validateUsername(username: string): void {
    const usernameRegex = /^[\w-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      throw new AuthError('Invalid username format', ErrorCode.INVALID_INPUT);
    }
  }

  private validatePassword(password: string): void {
    if (password.length < TEXT_CONSTRAINTS.MIN_PASSWORD_LENGTH) {
      throw new AuthError('Password too short', ErrorCode.INVALID_INPUT);
    }
    if (password.length > TEXT_CONSTRAINTS.MAX_PASSWORD_LENGTH) {
      throw new AuthError('Password too long', ErrorCode.INVALID_INPUT);
    }

    // Verificar complejidad de contraseña
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!"#$%&()*,.:<>?@^{|}]/.test(password);

    if (!hasLowerCase || !hasUpperCase || !hasNumbers || !hasSpecialChar) {
      throw new AuthError(
        'Password must contain uppercase, lowercase, numbers, and special characters',
        ErrorCode.INVALID_INPUT
      );
    }
  }

  // Métodos auxiliares
  private generateUUID(): UUID {
    return randomBytes(16).toString('hex');
  }

  private generateDeviceId(): string {
    return randomBytes(32).toString('hex');
  }

  private generateBackupCodes(): Array<string> {
    const codes: Array<string> = [];
    for (let index = 0; index < 10; index++) {
      codes.push(randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  private async recordFailedLogin(user: IAuthUser): Promise<void> {
    user.loginAttempts++;

    if (user.loginAttempts >= this.config.maxLoginAttempts) {
      user.lockedUntil = new Date(Date.now() + this.config.lockoutDuration);
    }

    await this.userRepository.update(user.id, user);
  }

  private async resetLoginAttempts(user: IAuthUser): Promise<void> {
    user.loginAttempts = 0;
    user.lockedUntil = undefined;
    await this.userRepository.update(user.id, user);
  }

  // Métodos Redis
  private async saveSession(sessionId: string, userId: UUID, deviceId: string): Promise<void> {
    const sessionData: ISessionData = {
      userId,
      deviceId,
      createdAt: new Date().toISOString()
    };

    await this.redis.setex(
      `session:${sessionId}`,
      Math.floor(TIME_CONSTRAINTS.REFRESH_TOKEN_TTL / 1000),
      JSON.stringify(sessionData)
    );
  }

  private async getSession(sessionId: string): Promise<ISessionData | null> {
    const sessionData = await this.redis.get(`session:${sessionId}`);
    return sessionData ? JSON.parse(sessionData) as ISessionData : null;
  }

  private async invalidateSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
    await this.redis.setex(
      `blacklist:${sessionId}`,
      Math.floor(TIME_CONSTRAINTS.REFRESH_TOKEN_TTL / 1000),
      '1'
    );
  }

  private async saveTemporaryMFASecret(userId: UUID, secret: string, backupCodes: Array<string>): Promise<void> {
    await this.redis.setex(
      `mfa_setup:${userId}`,
      600, // 10 minutos
      JSON.stringify({ secret, backupCodes })
    );
  }

  private async getTemporaryMFASecret(userId: UUID): Promise<ITemporaryMfaData | null> {
    const data = await this.redis.get(`mfa_setup:${userId}`);
    return data ? JSON.parse(data) as ITemporaryMfaData : null;
  }

  private async clearTemporaryMFASecret(userId: UUID): Promise<void> {
    await this.redis.del(`mfa_setup:${userId}`);
  }

  // Métodos de email (implementar con servicio de email)
  private async sendVerificationEmail(_email: string, _token: JWT): Promise<void> {
    // Implementar con servicio de email (SendGrid, AWS SES, etc.)
    // console.log(`[MOCK] Sending verification email to ${email} with token ${token}`);
  }

  // Métodos auxiliares que faltaban implementar
  public async findUserById(userId: UUID): Promise<IAuthUser | null> {
    try {
      const user = await this.userRepository.findById(userId);
      return user;
    } catch {
      // console.error('Error finding user by ID:', { userId, error });
      return null;
    }
  }

  public async updateUserRole(userId: UUID, newRole: UserRole): Promise<void> {
    try {
      await this.userRepository.updateRole(userId, newRole);
    } catch (error) {
      // console.error('Error updating user role:', { userId, newRole, error });
      throw new AppError('Failed to update user role', ErrorCode.INTERNAL_SERVER_ERROR, 500);
    }
  }
}