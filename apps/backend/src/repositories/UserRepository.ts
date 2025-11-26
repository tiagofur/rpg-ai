import { PrismaClient, UserRole as PrismaUserRole, AuthStatus as PrismaAuthStatus } from '@prisma/client';
import { IAuthUser, UUID, UserRole, AuthStatus } from '../types/index.js';

export class UserRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Método privado para mapear roles de forma segura
  private mapUserRole(role: string): UserRole {
    switch (role.toLowerCase()) {
      case 'super_admin': {
        return UserRole.SUPER_ADMIN;
      }
      case 'admin': {
        return UserRole.ADMIN;
      }
      case 'moderator': {
        return UserRole.MODERATOR;
      }
      case 'premium_user': {
        return UserRole.PREMIUM_USER;
      }
      case 'user': {
        return UserRole.USER;
      }
      case 'guest': {
        return UserRole.GUEST;
      }
      default: {
        return UserRole.USER;
      } // Valor por defecto seguro
    }
  }

  // Método privado para mapear estados de forma segura
  private mapAuthStatus(status: string): AuthStatus {
    switch (status.toLowerCase()) {
      case 'active': {
        return AuthStatus.ACTIVE;
      }
      case 'inactive': {
        return AuthStatus.INACTIVE;
      }
      case 'suspended': {
        return AuthStatus.SUSPENDED;
      }
      case 'banned': {
        return AuthStatus.BANNED;
      }
      case 'pending_verification': {
        return AuthStatus.PENDING_VERIFICATION;
      }
      default: {
        return AuthStatus.INACTIVE;
      } // Valor por defecto seguro
    }
  }

  private mapToPrismaUserRole(role: string): PrismaUserRole {
    switch (role) {
      case 'super_admin': return PrismaUserRole.SUPER_ADMIN;
      case 'admin': return PrismaUserRole.ADMIN;
      case 'moderator': return PrismaUserRole.MODERATOR;
      case 'premium_user': return PrismaUserRole.PREMIUM_USER;
      case 'user': return PrismaUserRole.USER;
      case 'guest': return PrismaUserRole.GUEST;
      default: return PrismaUserRole.USER;
    }
  }

  private mapToPrismaAuthStatus(status: string): PrismaAuthStatus {
    switch (status) {
      case 'active': return PrismaAuthStatus.ACTIVE;
      case 'inactive': return PrismaAuthStatus.INACTIVE;
      case 'suspended': return PrismaAuthStatus.SUSPENDED;
      case 'banned': return PrismaAuthStatus.BANNED;
      case 'pending_verification': return PrismaAuthStatus.PENDING_VERIFICATION;
      default: return PrismaAuthStatus.PENDING_VERIFICATION;
    }
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
        id: user.id,
        email: user.email,
        username: user.username,
        role: this.mapUserRole(user.role),
        status: this.mapAuthStatus(user.status),
        mfaEnabled: user.mfaEnabled,
        mfaSecret: user.mfaSecret || undefined,
        lastLoginAt: user.lastLoginAt || undefined,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async updateRole(userId: UUID, newRole: UserRole): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          role: this.mapToPrismaUserRole(newRole),
          updatedAt: new Date()
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating user role:', { userId, newRole, error });
      throw new Error('Failed to update user role');
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
        id: user.id,
        email: user.email,
        username: user.username,
        role: this.mapUserRole(user.role),
        status: this.mapAuthStatus(user.status),
        mfaEnabled: user.mfaEnabled,
        mfaSecret: user.mfaSecret || undefined,
        lastLoginAt: user.lastLoginAt || undefined,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      // eslint-disable-next-line no-console
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
          role: this.mapToPrismaUserRole(userData.role || 'user'),
          status: this.mapToPrismaAuthStatus(userData.status || 'pending_verification'),
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
        id: user.id,
        email: user.email,
        username: user.username,
        role: this.mapUserRole(user.role),
        status: this.mapAuthStatus(user.status),
        mfaEnabled: user.mfaEnabled,
        mfaSecret: user.mfaSecret || undefined,
        lastLoginAt: user.lastLoginAt || undefined,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async update(userId: UUID, updates: Partial<IAuthUser>): Promise<IAuthUser | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {
        username: updates.username,
        mfaEnabled: updates.mfaEnabled,
        mfaSecret: updates.mfaSecret,
        lastLoginAt: updates.lastLoginAt,
        loginAttempts: updates.loginAttempts,
        lockedUntil: updates.lockedUntil,
        updatedAt: new Date()
      };

      if (updates.role) {
        data.role = this.mapToPrismaUserRole(updates.role);
      }

      if (updates.status) {
        data.status = this.mapToPrismaAuthStatus(updates.status);
      }

      const user = await this.prisma.user.update({
        where: { id: userId },
        data,
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
        id: user.id,
        email: user.email,
        username: user.username,
        role: this.mapUserRole(user.role),
        status: this.mapAuthStatus(user.status),
        mfaEnabled: user.mfaEnabled,
        mfaSecret: user.mfaSecret || undefined,
        lastLoginAt: user.lastLoginAt || undefined,
        loginAttempts: user.loginAttempts,
        lockedUntil: user.lockedUntil || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.error('Error updating last login:', error);
    }
  }

  async enableMFA(userId: UUID, secret: string, backupCodes: Array<string>): Promise<void> {
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
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.error('Error disabling MFA:', error);
      throw new Error('Failed to disable MFA');
    }
  }
}