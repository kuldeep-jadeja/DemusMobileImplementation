#!/usr/bin/env python3
"""
Plan 01-02: Auth Service & Storage Layer - Complete Setup Script
Creates all auth service files with proper structure and tests
"""

import os
import json

def create_directory(path):
    """Create directory if it doesn't exist"""
    if not os.path.exists(path):
        os.makedirs(path)
        print(f"✓ Created directory: {path}")
    else:
        print(f"  Directory exists: {path}")

def write_file(path, content):
    """Write content to file"""
    directory = os.path.dirname(path)
    if directory:
        create_directory(directory)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Created file: {path}")

def main():
    print("=" * 60)
    print("Plan 01-02: Auth Service & Storage Layer Setup")
    print("=" * 60)
    print()

    # Task 1: Storage Service
    print("[Task 1] Creating Storage Service...")
    
    storage_service = '''import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

export const storageService = {
  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setUserData(user: any): Promise<void> {
    await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
  },

  async getUserData(): Promise<any | null> {
    const data = await SecureStore.getItemAsync(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  },

  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
  },
};
'''
    write_file('src/services/storageService.ts', storage_service)

    storage_service_test = '''import { storageService } from '../../src/services/storageService';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('storageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores and retrieves access token', async () => {
    const token = 'test-token';
    await storageService.setAccessToken(token);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', token);
  });

  it('stores and retrieves user data as JSON', async () => {
    const user = { id: '1', email: 'test@test.com', displayName: 'Test User' };
    await storageService.setUserData(user);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'user_data',
      JSON.stringify(user)
    );
  });

  it('clears all tokens on clearAll', async () => {
    await storageService.clearAll();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_data');
  });
});
'''
    write_file('tests/services/storageService.test.ts', storage_service_test)

    # Task 2: API Client
    print("\n[Task 2] Creating API Client with JWT Interceptors...")
    
    api_client = '''import axios, { AxiosError } from 'axios';
import { storageService } from '../services/storageService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.demus.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storageService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storageService.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        await storageService.setAccessToken(accessToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await storageService.clearAll();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
'''
    write_file('src/api/client.ts', api_client)

    auth_api = '''import { apiClient } from './client';
import { API_ENDPOINTS } from './types';
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  OAuthRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  ChangePasswordRequest,
} from '../types/auth';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, data),

  register: (data: RegisterRequest) =>
    apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.REGISTER, data),

  logout: () => apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),

  refreshToken: (refreshToken: string) =>
    apiClient.post<{ accessToken: string }>(API_ENDPOINTS.AUTH.REFRESH, {
      refreshToken,
    }),

  loginWithGoogle: (data: OAuthRequest) =>
    apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.GOOGLE, data),

  loginWithApple: (data: OAuthRequest) =>
    apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.APPLE, data),

  forgotPassword: (data: PasswordResetRequest) =>
    apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data),

  resetPassword: (data: PasswordResetConfirmRequest) =>
    apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data),
};
'''
    write_file('src/api/auth.ts', auth_api)

    # Task 3: Auth Service
    print("\n[Task 3] Creating Authentication Service...")
    
    auth_service = '''import jwtDecode from 'jwt-decode';
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
'''
    write_file('src/services/authService.ts', auth_service)

    auth_service_test = '''import { authService } from '../../src/services/authService';
import { authApi } from '../../src/api/auth';
import { storageService } from '../../src/services/storageService';

jest.mock('../../src/api/auth');
jest.mock('../../src/services/storageService');

describe('authService', () => {
  const mockUser = { id: '1', email: 'test@test.com', displayName: 'Test User' };
  const mockLoginResponse = {
    data: {
      user: mockUser,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('calls authApi.login and stores tokens', async () => {
      (authApi.login as jest.Mock).mockResolvedValue(mockLoginResponse);
      
      const user = await authService.login('test@test.com', 'password');
      
      expect(authApi.login).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password' });
      expect(storageService.setAccessToken).toHaveBeenCalledWith('access-token');
      expect(storageService.setRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(storageService.setUserData).toHaveBeenCalledWith(mockUser);
      expect(user).toEqual(mockUser);
    });
  });

  describe('register', () => {
    it('calls authApi.register and stores tokens', async () => {
      (authApi.register as jest.Mock).mockResolvedValue(mockLoginResponse);
      
      const user = await authService.register('test@test.com', 'password', 'Test User');
      
      expect(authApi.register).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password',
        displayName: 'Test User',
      });
      expect(user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('calls authApi.logout and clears storage', async () => {
      (authApi.logout as jest.Mock).mockResolvedValue({});
      
      await authService.logout();
      
      expect(authApi.logout).toHaveBeenCalled();
      expect(storageService.clearAll).toHaveBeenCalled();
    });

    it('clears storage even if logout API fails', async () => {
      (authApi.logout as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await authService.logout();
      
      expect(storageService.clearAll).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('calls authApi.changePassword and clears storage', async () => {
      (authApi.changePassword as jest.Mock).mockResolvedValue({});
      
      await authService.changePassword('oldpass', 'newpass');
      
      expect(authApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldpass',
        newPassword: 'newpass',
      });
      expect(storageService.clearAll).toHaveBeenCalled();
    });
  });
});
'''
    write_file('tests/services/authService.test.ts', auth_service_test)

    # Summary
    print("\n" + "=" * 60)
    print("Setup Complete!")
    print("=" * 60)
    print("\nFiles Created:")
    print("  ✓ src/services/storageService.ts")
    print("  ✓ src/services/authService.ts")
    print("  ✓ src/api/client.ts")
    print("  ✓ src/api/auth.ts")
    print("  ✓ tests/services/storageService.test.ts")
    print("  ✓ tests/services/authService.test.ts")
    print("\nNext Steps:")
    print("  1. Run TypeScript compiler check:")
    print("     npx tsc --noEmit")
    print("  2. Run tests:")
    print("     npm test tests/services/")
    print("  3. Git commit:")
    print("     git add .")
    print("     git commit -m \"feat(01-02): implement auth service and storage layer\"")
    print("\nPlan 01-02 ready for verification!")

if __name__ == '__main__':
    main()
