import { IAuthUser, UUID } from '../types';
import { PrismaClient } from '@prisma/client';

export class UserRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findByEmail(email: string): Promise<IAuthUser | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
          mfaEnabled: true,
          mfaSecret: true,
          lastLoginAt: true,
          loginAttempts: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true,
          password: true // Incluir password para verificación
        }
      });

      if (!user) return null;

      return {
        id: user.id as UUID,
        email: user.email,
        username: user.username,
        role: user.role as any,
        status: user.status as any,
        mfaEnabled: user.mfaEnabled,
        mfaSecret: user.mfaSecret || undefined,
        lastLoginAt: user.lastLoginAt || undefined,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findById(userId: UUID): Promise<IAuthUser | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
          mfaEnabled: true,
          mfaSecret: true,
          lastLoginAt: true,
          loginAttempts: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) return null;

      return {
        id: user.id as UUID,
        email: user.email,
        username: user.username,
        role: user.role as any,
        status: user.status as any,
        mfaEnabled: user.mfaEnabled,
        mfaSecret: user.mfaSecret || undefined,
        lastLoginAt: user.lastLoginAt || undefined,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  async create(userData: {
    email: string;
    username: string;
    password: string;
    role?: string;
    status?: string;
  }): Promise<IAuthUser> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: userData.email.toLowerCase(),
          username: userData.username,
          password: userData.password,
          role: userData.role || 'user',
          status: userData.status || 'pending_verification',
          mfaEnabled: false,
          loginAttempts: 0
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
          mfaEnabled: true,
          mfaSecret: true,
          lastLoginAt: true,
          loginAttempts: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return {
        id: user.id as UUID,
        email: user.email,
        username: user.username,
        role: user.role as any,
        status: user.status as any,
        mfaEnabled: user.mfaEnabled,
        mfaSecret: user.mfaSecret || undefined,
        lastLoginAt: user.lastLoginAt || undefined,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async update(userId: UUID, updates: Partial<IAuthUser>): Promise<IAuthUser | null> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          username: updates.username,
          role: updates.role,
          status: updates.status,
          mfaEnabled: updates.mfaEnabled,
          mfaSecret: updates.mfaSecret,
          lastLoginAt: updates.lastLoginAt,
          loginAttempts: updates.loginAttempts,
          lockedUntil: updates.lockedUntil,
          updatedAt: new Date()
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
          mfaEnabled: true,
          mfaSecret: true,
          lastLoginAt: true,
          loginAttempts: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return {
        id: user.id as UUID,
        email: user.email,
        username: user.username,
        role: user.role as any,
        status: user.status as any,
        mfaEnabled: user.mfaEnabled,
        mfaSecret: user.mfaSecret || undefined,
        lastLoginAt: user.lastLoginAt || undefined,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  async getPasswordHash(userId: UUID): Promise<string | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      });

      return user?.password || null;
    } catch (error) {
      console.error('Error getting password hash:', error);
      return null;
    }
  }

  async updateLastLogin(userId: UUID): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  async enableMFA(userId: UUID, secret: string, backupCodes: string[]): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
          mfaSecret: secret,
          updatedAt: new Date()
        }
      });

      // Guardar códigos de respaldo en una tabla separada
      await this.prisma.backupCode.createMany({
        data: backupCodes.map(code => ({
          userId,
          code,
          used: false
        }))
      });
    } catch (error) {
      console.error('Error enabling MFA:', error);
      throw new Error('Failed to enable MFA');
    }
  }

  async disableMFA(userId: UUID): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          updatedAt: new Date()
        }
      });

      // Marcar códigos de respaldo como eliminados
      await this.prisma.backupCode.deleteMany({
        where: { userId }
      });
    } catch (error) {
      console.error('Error disabling MFA:', error);
      throw new Error('Failed to disable MFA');
    }
  }
}