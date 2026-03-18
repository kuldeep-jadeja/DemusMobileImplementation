import { jwtDecode } from 'jwt-decode';
import { authApi } from '../api/auth';
import { storageService } from './storageService';
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  JWTPayload,
} from '../types/auth';
import type { User } from '../types/user';

export const authService = {
  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    const response = await authApi.register({ email, password, displayName });
    await this.storeTokens(response.data);
    return response.data.user;
  },

  async login(email: string, password: string): Promise<User> {
    const response = await authApi.login({ email, password });
    await this.storeTokens(response.data);
    return response.data.user;
  },

  async loginWithGoogle(authCode: string): Promise<User> {
    const response = await authApi.loginWithGoogle({ code: authCode });
    await this.storeTokens(response.data);
    return response.data.user;
  },

  async loginWithApple(authCode: string, idToken: string): Promise<User> {
    const response = await authApi.loginWithApple({
      code: authCode,
      idToken,
    });
    await this.storeTokens(response.data);
    return response.data.user;
  },

  async logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await storageService.clearAll();
    }
  },

  async refreshToken(): Promise<string> {
    const refreshToken = await storageService.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await authApi.refreshToken(refreshToken);
    await storageService.setAccessToken(response.data.accessToken);
    return response.data.accessToken;
  },

  async checkSession(): Promise<User | null> {
    const accessToken = await storageService.getAccessToken();
    if (!accessToken) {
      return null;
    }

    try {
      const decoded = jwtDecode<JWTPayload>(accessToken);
      const now = Date.now() / 1000;

      if (decoded.exp < now) {
        await this.refreshToken();
      }

      const userData = await storageService.getUserData();
      return userData;
    } catch (error) {
      await storageService.clearAll();
      return null;
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    await authApi.forgotPassword({ email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await authApi.resetPassword({ token, password: newPassword });
    await storageService.clearAll();
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await authApi.changePassword({ currentPassword, newPassword });
    await storageService.clearAll();
  },

  async storeTokens(data: LoginResponse): Promise<void> {
    await storageService.setAccessToken(data.accessToken);
    await storageService.setRefreshToken(data.refreshToken);
    await storageService.setUserData(data.user);
  },
};
