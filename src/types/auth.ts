import type { User } from './user';

// Authentication request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface OAuthRequest {
  code: string;
  idToken?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface JWTPayload {
  exp: number;
  iat: number;
  userId: string;
  email: string;
  tokenVersion?: number;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
