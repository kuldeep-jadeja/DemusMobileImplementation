import { apiClient } from './client';
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
