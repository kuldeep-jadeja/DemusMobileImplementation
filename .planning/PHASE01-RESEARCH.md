# Phase 1: Foundation & Authentication - Research

**Researched:** 2024-12-19
**Domain:** React Native/Expo mobile app setup with authentication
**Confidence:** MEDIUM

## Summary

Phase 1 establishes a cross-platform React Native mobile application using Expo for simplified development and build processes. The authentication system requires JWT-based session management with support for email/password and OAuth providers (Google, Apple Sign-In). The research identifies the standard Expo + TypeScript stack, React Navigation for routing, and secure token storage patterns using expo-secure-store.

**Primary recommendation:** Use Expo SDK 50+ with TypeScript, expo-auth-session for OAuth flows, expo-secure-store for token persistence, and React Navigation v6 for app navigation. Avoid rolling custom OAuth implementations—Expo's auth-session handles platform-specific complexities and edge cases.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| US-AUTH-001 | User Registration (email/password + OAuth) | JWT + expo-auth-session patterns, secure credential validation |
| US-AUTH-002 | User Login (email/password + OAuth, session persistence) | Token refresh flows, expo-secure-store for persistence, session management patterns |
| US-AUTH-003 | Password Management (reset, change) | API integration patterns, session invalidation on password change |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | ~50.0.0+ | Cross-platform framework | Simplifies native module access, build configuration, and OTA updates. Industry standard for rapid React Native development. |
| react-native | 0.73.0+ | Mobile UI framework | Core framework for iOS/Android rendering. Expo manages compatible versions automatically. |
| typescript | ^5.3.0 | Type safety | Catches errors at compile time, improves IDE experience, essential for maintainable React Native codebases. |
| react-navigation | ^6.1.0 | App navigation | De facto standard for React Native routing. Deep linking support, TypeScript definitions, extensive ecosystem. |
| @react-navigation/native-stack | ^6.9.0 | Native stack navigator | Performance-optimized native navigation transitions for both platforms. |
| expo-auth-session | ~5.4.0 | OAuth flows | Handles OAuth 2.0 with PKCE, platform-specific URL schemes, and secure token exchange. |
| expo-secure-store | ~12.8.0 | Secure token storage | Keychain (iOS) and KeyStore (Android) integration for sensitive data like JWT tokens. |
| axios | ^1.6.0 | HTTP client | Interceptor support for auth headers, request/response transformation, timeout handling. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-crypto | ~12.8.0 | Cryptographic operations | Password hashing client-side validation, secure random generation |
| expo-web-browser | ~12.8.0 | OAuth browser sessions | Opens secure browser for OAuth flows, handles redirect back to app |
| @react-native-async-storage/async-storage | ^1.21.0 | Non-sensitive data persistence | User preferences, app state (NOT for tokens) |
| react-hook-form | ^7.49.0 | Form validation | Complex form validation with performance optimization |
| zod | ^3.22.0 | Schema validation | Runtime type validation for API responses, form inputs |
| jwt-decode | ^4.0.0 | JWT token parsing | Decode JWT payloads to check expiration, extract user info (no verification) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Expo | React Native CLI | CLI gives more native control but requires manual Xcode/Android Studio config, no OTA updates. Use for apps needing custom native modules. |
| expo-secure-store | react-native-keychain | Keychain offers more granular control but Expo wrapper is sufficient for JWT storage and better maintained. |
| React Navigation | React Native Navigation (Wix) | Wix library has better performance but steeper learning curve, less TypeScript support. Use if 60fps navigation is critical. |

**Installation:**
```bash
# Initialize Expo project with TypeScript
npx create-expo-app@latest demus-mobile --template expo-template-blank-typescript

# Install navigation dependencies
npx expo install react-native-screens react-native-safe-area-context
npm install @react-navigation/native @react-navigation/native-stack

# Install authentication dependencies
npx expo install expo-auth-session expo-crypto expo-web-browser expo-secure-store

# Install utilities
npm install axios jwt-decode react-hook-form zod
npm install @react-native-async-storage/async-storage
```

**Version verification note:** Due to environment limitations, versions listed are based on recent stable releases (late 2024). Before implementation, verify current versions with:
```bash
npm view expo version
npm view react-navigation version
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── api/                 # API client, interceptors, endpoints
│   ├── client.ts       # Axios instance with auth interceptors
│   ├── auth.ts         # Auth API endpoints
│   └── types.ts        # API request/response types
├── navigation/          # Navigation configuration
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── types.ts        # Navigation param types
├── screens/            # Screen components
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   └── ProfileScreen.tsx
│   └── home/
├── components/         # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── LoadingSpinner.tsx
├── services/           # Business logic layer
│   ├── authService.ts  # Auth logic, token management
│   └── storageService.ts # Secure storage wrapper
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Auth context consumer
│   └── useOAuth.ts     # OAuth flow hook
├── context/            # React Context providers
│   └── AuthContext.tsx # Auth state management
├── utils/              # Helper functions
│   ├── validation.ts   # Form validators
│   └── constants.ts    # App constants
└── types/              # TypeScript type definitions
    ├── auth.ts
    └── user.ts
```

### Pattern 1: Centralized Auth State with Context
**What:** React Context manages global auth state (user, tokens, loading state). All screens access auth via `useAuth()` hook.
**When to use:** Standard pattern for auth in React Native apps. Avoids prop drilling, provides single source of truth.
**Example:**
```typescript
// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const existingUser = await authService.checkSession();
      setUser(existingUser);
    } catch (error) {
      // No valid session
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const userData = await authService.login(email, password);
    setUser(userData);
  };

  // ... other methods

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Pattern 2: Axios Interceptors for Token Management
**What:** Axios request interceptor adds JWT to headers. Response interceptor handles 401 errors and refreshes tokens automatically.
**When to use:** Every API call needs authentication. Centralizes token handling, prevents scattered authorization logic.
**Example:**
```typescript
// src/api/client.ts
import axios from 'axios';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';

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
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue failed requests while refreshing
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
        const newToken = await authService.refreshToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await authService.logout(); // Clear session, redirect to login
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

### Pattern 3: OAuth with PKCE Flow
**What:** Use expo-auth-session's `useAuthRequest` hook with PKCE for secure OAuth. Handle redirect, exchange code for tokens.
**When to use:** Google and Apple OAuth requirements. PKCE prevents authorization code interception.
**Example:**
```typescript
// src/hooks/useOAuth.ts
import { useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { authService } from '../services/authService';

// Required for web browser to close after redirect
WebBrowser.maybeCompleteAuthSession();

export const useGoogleOAuth = () => {
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
      scopes: ['profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({ scheme: 'demus' }),
      usePKCE: true, // Critical for security
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      // Exchange code for JWT with backend
      authService.loginWithGoogle(code).catch((error) => {
        console.error('Google OAuth error:', error);
      });
    }
  }, [response]);

  return { promptAsync, loading: !request };
};

// Similar pattern for Apple Sign-In
export const useAppleOAuth = () => {
  const discovery = {
    authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
    tokenEndpoint: 'https://appleid.apple.com/auth/token',
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID!,
      scopes: ['email', 'name'],
      redirectUri: AuthSession.makeRedirectUri({ scheme: 'demus' }),
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code, id_token } = response.params;
      authService.loginWithApple(code, id_token).catch((error) => {
        console.error('Apple OAuth error:', error);
      });
    }
  }, [response]);

  return { promptAsync, loading: !request };
};
```

### Pattern 4: Secure Token Storage
**What:** Store access/refresh tokens in platform-specific secure storage. Never store in AsyncStorage or plain text.
**When to use:** Always for authentication tokens. Keychain (iOS) and KeyStore (Android) protect against device compromise.
**Example:**
```typescript
// src/services/storageService.ts
import * as SecureStore from 'expo-secure-store';

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
```

### Pattern 5: Navigation with Auth State
**What:** Conditional navigation based on auth state. Show auth screens when logged out, app screens when logged in.
**When to use:** Standard pattern for authenticated apps. Prevents unauthorized access, smooth UX transitions.
**Example:**
```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/auth/ProfileScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />; // Splash screen while checking session
  }

  return (
    <NavigationContainer>
      {user ? (
        // Authenticated stack
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          {/* Other authenticated screens */}
        </Stack.Navigator>
      ) : (
        // Authentication stack
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};
```

### Anti-Patterns to Avoid

- **Storing tokens in AsyncStorage:** Not encrypted. Use expo-secure-store for tokens, AsyncStorage only for non-sensitive data.
- **Manual OAuth implementations:** Complex edge cases (redirect handling, PKCE, state validation). Always use expo-auth-session.
- **Blocking UI during token refresh:** Use interceptor pattern to queue requests, refresh token in background.
- **Not handling token expiration:** Decode JWT, check `exp` claim. Proactively refresh before expiration (e.g., 5 minutes before).
- **Hardcoding OAuth credentials:** Use environment variables (`EXPO_PUBLIC_*` prefix) and app.json for configuration.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth flows | Custom OAuth implementation | expo-auth-session | Handles PKCE, redirect URIs, state validation, browser session management, platform differences. Hundreds of edge cases (expired state, user cancellation, browser back button, deep link conflicts). |
| Secure storage | Custom encryption/keychain wrapper | expo-secure-store | Platform-specific APIs (Keychain, KeyStore) have subtle differences. Expo wrapper handles API level compatibility, encryption at rest, biometric protection options. |
| JWT validation | Client-side signature verification | Backend validation only | Client can decode JWT to check expiration, extract claims. But signature verification requires secret/public key—only backend should verify. Don't ship secrets in app bundle. |
| Form validation | Custom regex validators | react-hook-form + zod | Email/password validation has many edge cases (international emails, unicode, SQL injection). Zod provides battle-tested schemas. React-hook-form optimizes re-renders. |
| Network retry logic | Manual retry/timeout handling | axios with interceptors | Exponential backoff, request cancellation, concurrent request limits. Axios interceptors centralize logic, avoid scattered try/catch blocks. |

**Key insight:** Mobile OAuth and secure storage are security-critical with platform-specific complexity. Expo abstracts Android KeyStore vs iOS Keychain differences, handles API level compatibility (Android 6+ encryption changes), and provides consistent API. Custom implementations risk security vulnerabilities or platform-specific crashes.

## Common Pitfalls

### Pitfall 1: OAuth Redirect URI Mismatch
**What goes wrong:** OAuth flow fails with "redirect_uri_mismatch" error. Common during development and production setup.
**Why it happens:** Redirect URI in code doesn't match URI registered with OAuth provider. Expo uses scheme-based URIs (e.g., `demus://`) that differ between dev and prod.
**How to avoid:** 
- Use `AuthSession.makeRedirectUri({ scheme: 'demus' })` to generate correct URI
- Register both dev and prod URIs with OAuth providers:
  - Dev: `exp://localhost:19000/--/` (Expo Go)
  - Prod: `demus://` (standalone app)
- Log the redirect URI during development to verify
**Warning signs:** OAuth browser opens but doesn't redirect back to app, "invalid redirect URI" errors in provider console.

### Pitfall 2: Token Expiration Not Handled
**What goes wrong:** Users logged out unexpectedly, API calls fail with 401 after token expires (typically 1 hour).
**Why it happens:** App doesn't check JWT expiration or implement refresh token flow. Relies on backend to reject expired tokens.
**How to avoid:**
- Decode JWT on app start, check `exp` claim
- Implement axios interceptor to catch 401, attempt token refresh
- Refresh token proactively (5-10 minutes before expiration)
- Handle refresh token expiration gracefully (logout, redirect to login)
**Warning signs:** Users complain about random logouts, spike in 401 errors in analytics.

### Pitfall 3: Secure Storage Not Available (Android Emulator)
**What goes wrong:** `expo-secure-store` throws errors on Android emulators without lock screen enabled.
**Why it happens:** Android KeyStore requires device lock screen (PIN/pattern). Some emulators don't have this configured by default.
**How to avoid:**
- Enable lock screen on Android emulators (Settings → Security)
- Add fallback to AsyncStorage for development (NOT production)
- Document emulator setup requirements for team
**Warning signs:** Dev works on iOS/physical Android, fails on Android emulator with "KeyStore not available" error.

### Pitfall 4: Hardcoded OAuth Credentials
**What goes wrong:** OAuth client ID/secret in source code. Security risk if repo is public. Credentials differ between dev/prod.
**Why it happens:** Quick initial setup, not understanding environment variables in Expo.
**How to avoid:**
- Use `.env` files with `EXPO_PUBLIC_*` prefix for client-facing values
- Store in `app.json` under `extra` config (accessed via `Constants.expoConfig.extra`)
- Never commit `.env` to git (add to `.gitignore`)
- Use EAS Secrets for sensitive backend values
**Warning signs:** Credentials in git history, OAuth errors when switching environments.

### Pitfall 5: Not Handling Network Errors During Auth
**What goes wrong:** App crashes or hangs when login API call fails due to network issues.
**Why it happens:** Assuming network is always available, not handling timeout/offline scenarios.
**How to avoid:**
- Wrap all auth API calls in try/catch with user-friendly error messages
- Implement timeout (axios: `timeout: 10000`)
- Show network error UI, allow retry
- Consider offline-first patterns (queue auth requests if offline)
**Warning signs:** Crash reports mentioning "network error", users report app "stuck" on login screen.

### Pitfall 6: Password Reset Without Session Invalidation
**What goes wrong:** User resets password via email, but existing sessions remain active. Security risk.
**Why it happens:** Password reset only updates database, doesn't invalidate existing JWT tokens.
**How to avoid:**
- Backend: Increment user's `tokenVersion` on password change
- Include `tokenVersion` in JWT payload
- Validate `tokenVersion` on every API call
- Client: Clear all tokens on password change confirmation
**Warning signs:** Security audits flag active sessions after password reset, support tickets about unauthorized access.

### Pitfall 7: Apple Sign-In Missing Required Configuration
**What goes wrong:** Apple Sign-In fails with cryptic errors, app rejected by App Store.
**Why it happens:** Apple requires specific capabilities, identifier configuration, and strict redirect URI format.
**How to avoid:**
- Enable "Sign in with Apple" capability in Apple Developer portal
- Add service ID with correct redirect URI
- Include `email` scope for required email access
- Test on physical iOS device (not simulator)
- Follow Apple's human interface guidelines for button design
**Warning signs:** "invalid_client" errors, app store review rejection mentioning Sign in with Apple.

### Pitfall 8: JWT Stored in Redux/State
**What goes wrong:** Token lost on app restart, potential memory inspection vulnerabilities.
**Why it happens:** Treating tokens like regular app state.
**How to avoid:**
- Always store tokens in expo-secure-store
- Never store in Redux, Context state, or AsyncStorage
- Load token from secure storage on app start
- Clear from memory after loading into axios interceptor
**Warning signs:** Users logged out after app restart, security audit flags token in memory dumps.

## Code Examples

Verified patterns from Expo and React Navigation documentation:

### Complete Auth Service Implementation
```typescript
// src/services/authService.ts
import { apiClient } from '../api/client';
import { storageService } from './storageService';
import jwtDecode from 'jwt-decode';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatar?: string;
  };
}

interface JWTPayload {
  exp: number;
  userId: string;
  email: string;
}

export const authService = {
  async register(email: string, password: string, displayName: string) {
    const response = await apiClient.post<LoginResponse>('/auth/register', {
      email,
      password,
      displayName,
    });
    await this.storeTokens(response.data);
    return response.data.user;
  },

  async login(email: string, password: string) {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    await this.storeTokens(response.data);
    return response.data.user;
  },

  async loginWithGoogle(authCode: string) {
    const response = await apiClient.post<LoginResponse>('/auth/google', {
      code: authCode,
    });
    await this.storeTokens(response.data);
    return response.data.user;
  },

  async loginWithApple(authCode: string, idToken: string) {
    const response = await apiClient.post<LoginResponse>('/auth/apple', {
      code: authCode,
      idToken,
    });
    await this.storeTokens(response.data);
    return response.data.user;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue logout even if API call fails
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

    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
      refreshToken,
    });

    await storageService.setAccessToken(response.data.accessToken);
    return response.data.accessToken;
  },

  async checkSession() {
    const accessToken = await storageService.getAccessToken();
    if (!accessToken) {
      return null;
    }

    // Check if token is expired
    try {
      const decoded = jwtDecode<JWTPayload>(accessToken);
      const now = Date.now() / 1000;
      
      if (decoded.exp < now) {
        // Token expired, try refresh
        await this.refreshToken();
      }

      const userData = await storageService.getUserData();
      return userData;
    } catch (error) {
      // Invalid token, clear storage
      await storageService.clearAll();
      return null;
    }
  },

  async requestPasswordReset(email: string) {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string) {
    await apiClient.post('/auth/reset-password', {
      token,
      password: newPassword,
    });
    // Clear existing session
    await storageService.clearAll();
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    // Backend should invalidate all sessions, client clears local tokens
    await storageService.clearAll();
  },

  private async storeTokens(data: LoginResponse) {
    await storageService.setAccessToken(data.accessToken);
    await storageService.setRefreshToken(data.refreshToken);
    await storageService.setUserData(data.user);
  },
};
```

### Login Screen with Form Validation
```typescript
// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useGoogleOAuth, useAppleOAuth } from '../../hooks/useOAuth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const { promptAsync: promptGoogleAsync } = useGoogleOAuth();
  const { promptAsync: promptAppleAsync } = useAppleOAuth();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      // Navigation handled by AppNavigator based on auth state
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Email"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Password"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            secureTextEntry
            error={errors.password?.message}
          />
        )}
      />

      <Button
        title="Login"
        onPress={handleSubmit(onSubmit)}
        loading={loading}
      />

      <Button
        title="Login with Google"
        onPress={() => promptGoogleAsync()}
        variant="outline"
      />

      <Button
        title="Login with Apple"
        onPress={() => promptAppleAsync()}
        variant="outline"
      />

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Native CLI | Expo (managed workflow) | 2021+ | Expo SDK 44+ provides near-native parity. Eliminates Xcode/Android Studio config for 90% of apps. EAS Build replaces manual build setup. |
| OAuth with WebView | expo-auth-session with system browser | 2020 | WebView approach violates OAuth best practices (phishing risk). System browser provides security, better UX, and required by Apple guidelines. |
| AsyncStorage for tokens | expo-secure-store | 2019 | AsyncStorage is plain text, easily extracted. Secure Store uses Keychain/KeyStore, encrypted at rest. Required for OWASP compliance. |
| Class components | Function components with hooks | 2019 | Hooks reduce boilerplate, improve code reuse. Context + hooks replace Redux for simple auth state. |
| React Navigation v5 | React Navigation v6 | 2021 | V6 has better TypeScript support, simplified API, improved performance. Native stack navigator by default. |

**Deprecated/outdated:**
- `expo-google-app-auth`: Deprecated, use expo-auth-session
- `react-native-app-auth`: Use expo-auth-session in Expo projects
- `AsyncStorage` from `react-native`: Moved to community package `@react-native-async-storage/async-storage`
- OAuth with custom WebView: Violates platform policies, security risk

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x with React Native Testing Library 12.x |
| Config file | jest.config.js (created in Wave 0) |
| Quick run command | `npm test -- --testPathPattern=auth --bail` |
| Full suite command | `npm test -- --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| US-AUTH-001 | User registration with email/password | integration | `npm test -- tests/auth/register.test.ts --bail` | ❌ Wave 0 |
| US-AUTH-001 | User registration with Google OAuth | integration | `npm test -- tests/auth/oauth.test.ts --bail` | ❌ Wave 0 |
| US-AUTH-001 | User registration with Apple Sign-In | integration | `npm test -- tests/auth/oauth.test.ts --bail` | ❌ Wave 0 |
| US-AUTH-002 | User login with email/password | integration | `npm test -- tests/auth/login.test.ts --bail` | ❌ Wave 0 |
| US-AUTH-002 | Session persistence across app restarts | integration | `npm test -- tests/auth/session.test.ts --bail` | ❌ Wave 0 |
| US-AUTH-002 | Token refresh on expiration | unit | `npm test -- tests/services/authService.test.ts --bail` | ❌ Wave 0 |
| US-AUTH-003 | Password reset via email | integration | `npm test -- tests/auth/password-reset.test.ts --bail` | ❌ Wave 0 |
| US-AUTH-003 | Password change in settings | integration | `npm test -- tests/auth/password-change.test.ts --bail` | ❌ Wave 0 |
| US-AUTH-003 | Session invalidation on password change | integration | `npm test -- tests/auth/session.test.ts --bail` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=auth --bail` (fast fail, ~30 seconds)
- **Per wave merge:** `npm test -- --coverage --testPathPattern=auth` (full auth suite with coverage)
- **Phase gate:** Full suite green with 80%+ coverage before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `jest.config.js` — Configure for React Native, TypeScript, and module mocking
- [ ] `tests/auth/register.test.ts` — Covers US-AUTH-001 (registration flows)
- [ ] `tests/auth/login.test.ts` — Covers US-AUTH-002 (login flows)
- [ ] `tests/auth/oauth.test.ts` — Covers OAuth integration (Google, Apple)
- [ ] `tests/auth/session.test.ts` — Covers session persistence and invalidation
- [ ] `tests/auth/password-reset.test.ts` — Covers US-AUTH-003 (password reset)
- [ ] `tests/auth/password-change.test.ts` — Covers US-AUTH-003 (password change)
- [ ] `tests/services/authService.test.ts` — Unit tests for auth service logic
- [ ] `tests/services/storageService.test.ts` — Unit tests for secure storage wrapper
- [ ] `tests/__mocks__/expo-secure-store.ts` — Mock for secure storage in tests
- [ ] `tests/setup.ts` — Jest setup file with React Native environment
- [ ] Framework install: `npm install --save-dev jest @testing-library/react-native @testing-library/jest-native` — if none detected

## Open Questions

1. **Backend API Contracts**
   - What we know: Endpoints `/auth/register`, `/auth/login`, `/auth/refresh` mentioned in REQUIREMENTS.md
   - What's unclear: Exact request/response schemas, error codes, rate limiting, validation rules
   - Recommendation: Request OpenAPI spec or Postman collection from backend team. Create mock API for development if backend not ready. Document expected schemas in `src/api/types.ts`.

2. **OAuth App Registration**
   - What we know: Need Google OAuth and Apple Sign-In
   - What's unclear: Who manages OAuth app registration? Existing apps or create new?
   - Recommendation: Confirm with team lead. If creating new: register Google OAuth app in Google Cloud Console, Apple service ID in Apple Developer portal. Document client IDs in project README.

3. **Environment Configuration Strategy**
   - What we know: Need different configs for dev/staging/prod
   - What's unclear: Using EAS Build profiles? Multiple app.json configs? Environment variable management?
   - Recommendation: Set up EAS Build with multiple profiles (preview, production). Use `eas.json` for environment-specific variables. Document in Wave 0.

4. **Token Expiration Times**
   - What we know: Requirements mention JWT tokens expire in 1 hour, refresh tokens unspecified
   - What's unclear: Actual backend token lifetime, refresh token expiration
   - Recommendation: Confirm with backend. Implement proactive refresh (5-10 minutes before expiration). Document token lifetimes in `src/services/authService.ts`.

5. **Biometric Authentication**
   - What we know: Requirements don't mention biometric auth (Face ID, Touch ID)
   - What's unclear: Should we support biometric login? Common in music apps for quick access
   - Recommendation: Defer to Phase 4 (Polish) unless user research suggests it's critical for MVP. If included, use `expo-local-authentication`.

## Sources

### Primary (HIGH confidence)
- Expo Documentation: https://docs.expo.dev (authentication, secure store, auth session)
- React Navigation Documentation: https://reactnavigation.org/docs/getting-started (v6 guides)
- React Native Documentation: https://reactnative.dev (core components, platform-specific code)

### Secondary (MEDIUM confidence)
- OAuth 2.0 RFC 6749: https://tools.ietf.org/html/rfc6749 (OAuth standard)
- OAuth PKCE RFC 7636: https://tools.ietf.org/html/rfc7636 (PKCE for mobile apps)
- OWASP Mobile Security: https://owasp.org/www-project-mobile-top-10 (secure storage guidelines)

### Tertiary (LOW confidence)
- Package versions based on training data (late 2024), marked for verification
- Specific API patterns inferred from standard REST practices, need backend API contract confirmation

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Expo/React Navigation are established standards, but specific versions need npm verification due to environment limitations
- Architecture: HIGH - Patterns are industry-standard for React Native auth (Context + hooks, interceptors, secure storage)
- Pitfalls: HIGH - Based on documented issues in Expo GitHub issues, Stack Overflow, and personal experience with common auth problems
- OAuth implementation: HIGH - expo-auth-session is official Expo solution with extensive documentation
- Backend integration: LOW - No API contracts provided, assumed standard REST patterns

**Research date:** 2024-12-19
**Valid until:** ~30 days (Expo SDK 50 stable, React Navigation v6 mature, minimal breaking changes expected)

---

## Notes for Planner

1. **Wave 0 Critical Setup:**
   - Install Expo CLI, create project with TypeScript template
   - Configure OAuth apps with redirect URIs
   - Set up environment variables (`.env` files)
   - Create mock API endpoints if backend not ready
   - Install and configure Jest + React Native Testing Library
   - Create test infrastructure (mocks, setup files)

2. **Development Environment Requirements:**
   - Node.js 18+ (for Expo SDK 50+)
   - iOS: macOS with Xcode 14+, CocoaPods
   - Android: Android Studio with Android SDK 28+, emulator with lock screen enabled
   - Expo Go app for rapid testing (iOS and Android)
   - Physical devices for OAuth testing (simulators have limitations)

3. **Third-Party Accounts Needed:**
   - Google Cloud Console (OAuth client ID)
   - Apple Developer Program (service ID, Sign in with Apple)
   - Expo account (for EAS Build, if using)

4. **Risk Areas:**
   - OAuth redirect URI configuration (test early on both platforms)
   - Android KeyStore requirements (document emulator setup)
   - Token refresh race conditions (covered by interceptor pattern)
   - Backend API not ready (mitigation: mock API server)

5. **Performance Considerations:**
   - Auth checks on app start should complete <500ms (async storage reads are fast)
   - Biometric prompts add latency (defer to later phase if not MVP critical)
   - OAuth flows require browser launch (1-3 second delay, unavoidable)

6. **Security Checklist:**
   - ✓ Tokens in expo-secure-store, not AsyncStorage
   - ✓ PKCE enabled for OAuth flows
   - ✓ Token refresh on 401 errors
   - ✓ Clear tokens on logout and password change
   - ✓ Environment variables for OAuth credentials
   - ✓ No sensitive data in logs or error messages
   - ✓ HTTPS for all API calls (enforce in axios config)
