export type UUID = string;
export type ISOTimestamp = string;

export interface IAuthUser {
  id: string;
  email: string;
  username: string;
  isEmailVerified: boolean;
  isMfaEnabled: boolean;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface IMfaSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface ILoginAttempt {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  createdAt: Date;
}