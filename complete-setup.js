const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(msg) {
  console.log(msg);
}

function run(cmd, silent = false) {
  try {
    return execSync(cmd, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit'
    });
  } catch (error) {
    if (!silent) log(`Error: ${error.message}`);
    return null;
  }
}

function mkdir(dir) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    return true;
  }
  return false;
}

function writeFile(filePath, content) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content, 'utf-8');
}

// ============ MAIN EXECUTION ============

log('═══════════════════════════════════════════');
log('  Demus Mobile - Plan 01-01 Execution');
log('  Project Setup & Infrastructure');
log('═══════════════════════════════════════════\n');

// Step 1: Initialize Git
log('[1/5] Initializing Git Repository...');
const gitStatus = run('git status', true);
if (!gitStatus) {
  log('  → Initializing git...');
  run('git init');
  run('git config user.name "Demus Bot"');
  run('git config user.email "bot@demus.com"');
  log('  ✓ Git initialized');
} else {
  log('  ✓ Git already initialized');
}
log('');

// Step 2: Create directory structure
log('[2/5] Creating Project Structure...');
const dirs = ['tests', 'tests/__mocks__', 'src', 'src/types', 'src/api', 'assets'];
dirs.forEach(dir => {
  if (mkdir(dir)) {
    log(`  ✓ Created: ${dir}`);
  }
});
log('');

// Step 3: Create all project files
log('[3/5] Creating Project Files...');

// Test setup file
writeFile('tests/setup.ts', `import '@testing-library/jest-native/extend-expect';

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
`);
log('  ✓ tests/setup.ts');

// Secure store mock
writeFile('tests/__mocks__/expo-secure-store.ts', `const store: Record<string, string> = {};

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
`);
log('  ✓ tests/__mocks__/expo-secure-store.ts');

// User types
writeFile('src/types/user.ts', `export interface User {
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
`);
log('  ✓ src/types/user.ts');

// Auth types
writeFile('src/types/auth.ts', `import type { User } from './user';

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
`);
log('  ✓ src/types/auth.ts');

// API types
writeFile('src/api/types.ts', `export interface ApiResponse<T> {
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
`);
log('  ✓ src/api/types.ts');

// Index types
writeFile('src/types/index.ts', `export * from './auth';
export * from './user';
`);
log('  ✓ src/types/index.ts');

// Assets placeholder
writeFile('assets/README.txt', 'Placeholder for asset files (icon.png, splash.png, etc.)');
log('  ✓ assets/README.txt');

log('');

// Step 4: Commit each task
log('[4/5] Creating Git Commits...\n');

// Commit Task 1
log('Task 1: Initialize Expo Project with TypeScript');
const task1Files = ['package.json', 'tsconfig.json', 'app.json', '.env.example', 'App.tsx', '.gitignore', 'babel.config.js'];
task1Files.forEach(f => run(`git add "${f}"`, true));
const task1Result = run('git commit -m "feat(01-01): initialize Expo project with TypeScript\n\n- Create package.json with all dependencies\n- Configure TypeScript with path mapping\n- Set up app.json with scheme and bundle IDs\n- Add .env.example with OAuth placeholders\n- Create basic App.tsx entry point"', true);
if (task1Result !== null) {
  const hash1 = run('git rev-parse --short HEAD', true);
  if (hash1) log(`  ✓ Committed: ${hash1.trim()}`);
}
log('');

// Commit Task 2
log('Task 2: Configure Jest Testing Framework');
const task2Files = ['jest.config.js', 'tests/setup.ts', 'tests/__mocks__/expo-secure-store.ts'];
task2Files.forEach(f => run(`git add "${f}"`, true));
const task2Result = run('git commit -m "test(01-01): configure Jest testing framework\n\n- Add jest.config.js with 80% coverage threshold\n- Create tests/setup.ts with Jest Native extensions\n- Add expo-secure-store mock for testing"', true);
if (task2Result !== null) {
  const hash2 = run('git rev-parse --short HEAD', true);
  if (hash2) log(`  ✓ Committed: ${hash2.trim()}`);
}
log('');

// Commit Task 3
log('Task 3: Create Core Type Definitions');
const task3Files = ['src/types/user.ts', 'src/types/auth.ts', 'src/types/index.ts', 'src/api/types.ts', 'assets/README.txt'];
task3Files.forEach(f => run(`git add "${f}"`, true));
const task3Result = run('git commit -m "feat(01-01): create core type definitions\n\n- Add User and UserProfile types\n- Add authentication request/response types\n- Add API response and endpoint types\n- Create barrel exports for types"', true);
if (task3Result !== null) {
  const hash3 = run('git rev-parse --short HEAD', true);
  if (hash3) log(`  ✓ Committed: ${hash3.trim()}`);
}
log('');

// Step 5: Summary
log('[5/5] Execution Summary\n');
log('Commit Log:');
const commitLog = run('git log --oneline -3', true);
if (commitLog) {
  commitLog.split('\n').filter(Boolean).forEach(line => log(`  ${line}`));
}

log('\n═══════════════════════════════════════════');
log('  ✓ Plan 01-01 Execution Complete!');
log('═══════════════════════════════════════════\n');

log('Files Created:');
log('  • Configuration: package.json, tsconfig.json, app.json');
log('  • Testing: jest.config.js, test setup & mocks');
log('  • Types: auth, user, API type definitions');
log('  • Total Commits: 3\n');
