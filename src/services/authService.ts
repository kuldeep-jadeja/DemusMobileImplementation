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

// Enable mock mode for testing without backend
const MOCK_MODE = false; // Set to false when backend is ready

// Mock user database (in-memory for demo)
const mockUsers: Record<string, { email: string; password: string; displayName: string; id: string }> = {};

// Generate mock JWT token
function generateMockToken(userId: string, email: string): string {
  const payload = {
    userId,
    email,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  };
  // Simple base64 encoding (not secure, just for testing)
  return btoa(JSON.stringify(payload));
}

export const authService = {
  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<User> {
    if (MOCK_MODE) {
      // Mock registration
      console.log('🔧 MOCK MODE: Registering user', email);
      
      // Check if user already exists
      if (mockUsers[email]) {
        throw new Error('User already exists');
      }
      
      // Create mock user
      const userId = `user_${Date.now()}`;
      mockUsers[email] = { email, password, displayName, id: userId };
      
      const user: User = {
        id: userId,
        email,
        username: displayName,
        displayName,
        createdAt: new Date().toISOString(),
        profileImageUrl: undefined,
      };
      
      const mockToken = generateMockToken(userId, email);
      await storageService.setAccessToken(mockToken);
      await storageService.setRefreshToken(mockToken);
      await storageService.setUserData(user);
      
      console.log('✅ MOCK MODE: User registered successfully');
      return user;
    }
    
    // Backend /api/auth/signup expects { email, password } only
    const response = await authApi.register({ email, password });
    const backendUser = response.data.user;
    
    // Map backend user to our User type
    const user: User = {
      id: backendUser.id,
      email: backendUser.email,
      username: displayName || backendUser.email.split('@')[0],
      displayName: displayName || backendUser.email.split('@')[0],
      createdAt: new Date().toISOString(),
      profileImageUrl: undefined,
    };
    
    // Store user data (no tokens - backend uses cookies)
    await storageService.setUserData(user);
    
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    if (MOCK_MODE) {
      // Mock login
      console.log('🔧 MOCK MODE: Logging in user', email);
      
      const mockUser = mockUsers[email];
      if (!mockUser || mockUser.password !== password) {
        throw new Error('Invalid credentials');
      }
      
      const user: User = {
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.displayName,
        displayName: mockUser.displayName,
        createdAt: new Date().toISOString(),
        profileImageUrl: undefined,
      };
      
      const mockToken = generateMockToken(mockUser.id, email);
      await storageService.setAccessToken(mockToken);
      await storageService.setRefreshToken(mockToken);
      await storageService.setUserData(user);
      
      console.log('✅ MOCK MODE: User logged in successfully');
      return user;
    }
    
    // Backend returns { user: { id, email } } and sets HTTP-only cookie
    const response = await authApi.login({ email, password });
    const backendUser = response.data.user;
    
    // Map backend user to our User type
    const user: User = {
      id: backendUser.id,
      email: backendUser.email,
      username: backendUser.email.split('@')[0], // Use email prefix as username
      displayName: backendUser.email.split('@')[0], // Backend doesn't have displayName
      createdAt: new Date().toISOString(),
      profileImageUrl: undefined,
    };
    
    // Store user data (no tokens - backend uses cookies)
    await storageService.setUserData(user);
    
    return user;
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
    // For backend with cookie-based auth, just check if we have stored user data
    // The cookie will be automatically sent with API requests by the HTTP client
    const userData = await storageService.getUserData();
    
    if (!userData) {
      return null;
    }
    
    // If we have user data, verify the session is still valid by making a test API call
    // This will use the HTTP-only cookie automatically
    try {
      // Try to fetch user profile or playlists to verify session
      // If the API call fails with 401, the session is expired
      return userData;
    } catch (error) {
      // Session expired, clear storage
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
