const fs = require('fs');
const path = require('path');

console.log('=== Setting up project structure ===\n');

// 1. Create directories
console.log('Creating directories...');
const dirs = [
  'tests',
  'tests/__mocks__',
  'src',
  'src/types',
  'src/api',
  'assets'
];

dirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  ✓ Created: ${dir}`);
  } else {
    console.log(`  Already exists: ${dir}`);
  }
});

// 2. Create test setup files
console.log('\nCreating test setup files...');

const testSetup = `import '@testing-library/jest-native/extend-expect';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => require('./__mocks__/expo-secure-store'));

// Mock expo-auth-session
jest.mock('expo-auth-session');

// Mock expo-web-browser
jest.mock('expo-web-browser');

// Silence console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
`;

const secureStoreMock = `const store: Record<string, string> = {};

export const setItemAsync = jest.fn((key: string, value: string) => {
  store[key] = value;
  return Promise.resolve();
});

export const getItemAsync = jest.fn((key: string) => {
  return Promise.resolve(store[key] || null);
});

export const deleteItemAsync = jest.fn((key: string) => {
  delete store[key];
  return Promise.resolve();
});
`;

fs.writeFileSync('tests/setup.ts', testSetup);
console.log('  ✓ tests/setup.ts');

fs.writeFileSync('tests/__mocks__/expo-secure-store.ts', secureStoreMock);
console.log('  ✓ tests/__mocks__/expo-secure-store.ts');

// 3. Create type definition files
console.log('\nCreating type definitions...');

const userTypes = `export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  bio?: string;
  favoriteGenres?: string[];
  followersCount: number;
  followingCount: number;
}
`;

const authTypes = `import type { User } from './user';

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
`;

const apiTypes = `export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    GOOGLE: '/auth/google',
    APPLE: '/auth/apple',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
  },
} as const;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}
`;

const indexTypes = `export * from './auth';
export * from './user';
`;

fs.writeFileSync('src/types/user.ts', userTypes);
console.log('  ✓ src/types/user.ts');

fs.writeFileSync('src/types/auth.ts', authTypes);
console.log('  ✓ src/types/auth.ts');

fs.writeFileSync('src/api/types.ts', apiTypes);
console.log('  ✓ src/api/types.ts');

fs.writeFileSync('src/types/index.ts', indexTypes);
console.log('  ✓ src/types/index.ts');

// 4. Create placeholder assets
console.log('\nCreating placeholder assets...');

// Create a simple text file as placeholder for now
const assetPlaceholder = 'Placeholder for asset files (icon.png, splash.png, etc.)';
fs.writeFileSync('assets/README.txt', assetPlaceholder);
console.log('  ✓ assets/README.txt');

console.log('\n=== Setup complete! ===');
console.log('\nFiles created:');
console.log('  - jest.config.js');
console.log('  - tests/setup.ts');
console.log('  - tests/__mocks__/expo-secure-store.ts');
console.log('  - src/types/user.ts');
console.log('  - src/types/auth.ts');
console.log('  - src/types/index.ts');
console.log('  - src/api/types.ts');
console.log('  - assets/README.txt');
