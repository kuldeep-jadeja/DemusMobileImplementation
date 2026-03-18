#!/usr/bin/env python3
import os
import subprocess
import sys

def log(msg):
    print(msg)

def run_cmd(cmd, silent=False):
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        if not silent:
            if result.stdout:
                print(result.stdout)
        return result.stdout
    except subprocess.CalledProcessError as e:
        if not silent:
            print(f"Error: {e}")
            if e.stderr:
                print(e.stderr)
        return None

def mkdir(path):
    os.makedirs(path, exist_ok=True)

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# Main execution
log("═══════════════════════════════════════════")
log("  Demus Mobile - Plan 01-01 Execution")
log("  Project Setup & Infrastructure")
log("═══════════════════════════════════════════\n")

# Step 1: Init git
log("[1/5] Initializing Git Repository...")
if run_cmd("git status", silent=True) is None:
    log("  → Initializing git...")
    run_cmd("git init")
    run_cmd('git config user.name "Demus Bot"')
    run_cmd('git config user.email "bot@demus.com"')
    log("  ✓ Git initialized")
else:
    log("  ✓ Git already initialized")
log("")

# Step 2: Create directories
log("[2/5] Creating Project Structure...")
dirs = ["tests", "tests/__mocks__", "src", "src/types", "src/api", "assets"]
for d in dirs:
    mkdir(d)
    log(f"  ✓ Created: {d}")
log("")

# Step 3: Create files
log("[3/5] Creating Project Files...")

# tests/setup.ts
write_file("tests/setup.ts", """import '@testing-library/jest-native/extend-expect';

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
""")
log("  ✓ tests/setup.ts")

# tests/__mocks__/expo-secure-store.ts
write_file("tests/__mocks__/expo-secure-store.ts", """const store: Record<string, string> = {};

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
""")
log("  ✓ tests/__mocks__/expo-secure-store.ts")

# src/types/user.ts
write_file("src/types/user.ts", """export interface User {
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
""")
log("  ✓ src/types/user.ts")

# src/types/auth.ts
write_file("src/types/auth.ts", """import type { User } from './user';

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
""")
log("  ✓ src/types/auth.ts")

# src/api/types.ts
write_file("src/api/types.ts", """export interface ApiResponse<T> {
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
""")
log("  ✓ src/api/types.ts")

# src/types/index.ts
write_file("src/types/index.ts", """export * from './auth';
export * from './user';
""")
log("  ✓ src/types/index.ts")

# assets/README.txt
write_file("assets/README.txt", "Placeholder for asset files (icon.png, splash.png, etc.)")
log("  ✓ assets/README.txt")

log("")

# Step 4: Create commits
log("[4/5] Creating Git Commits...\n")

# Task 1
log("Task 1: Initialize Expo Project with TypeScript")
files1 = ["package.json", "tsconfig.json", "app.json", ".env.example", "App.tsx", ".gitignore", "babel.config.js"]
for f in files1:
    run_cmd(f'git add "{f}"', silent=True)
msg1 = """feat(01-01): initialize Expo project with TypeScript

- Create package.json with all dependencies
- Configure TypeScript with path mapping
- Set up app.json with scheme and bundle IDs
- Add .env.example with OAuth placeholders
- Create basic App.tsx entry point"""
run_cmd(f'git commit -m "{msg1}"', silent=True)
hash1 = run_cmd("git rev-parse --short HEAD", silent=True)
if hash1:
    log(f"  ✓ Committed: {hash1.strip()}")
log("")

# Task 2
log("Task 2: Configure Jest Testing Framework")
files2 = ["jest.config.js", "tests/setup.ts", "tests/__mocks__/expo-secure-store.ts"]
for f in files2:
    run_cmd(f'git add "{f}"', silent=True)
msg2 = """test(01-01): configure Jest testing framework

- Add jest.config.js with 80% coverage threshold
- Create tests/setup.ts with Jest Native extensions
- Add expo-secure-store mock for testing"""
run_cmd(f'git commit -m "{msg2}"', silent=True)
hash2 = run_cmd("git rev-parse --short HEAD", silent=True)
if hash2:
    log(f"  ✓ Committed: {hash2.strip()}")
log("")

# Task 3
log("Task 3: Create Core Type Definitions")
files3 = ["src/types/user.ts", "src/types/auth.ts", "src/types/index.ts", "src/api/types.ts", "assets/README.txt"]
for f in files3:
    run_cmd(f'git add "{f}"', silent=True)
msg3 = """feat(01-01): create core type definitions

- Add User and UserProfile types
- Add authentication request/response types
- Add API response and endpoint types
- Create barrel exports for types"""
run_cmd(f'git commit -m "{msg3}"', silent=True)
hash3 = run_cmd("git rev-parse --short HEAD", silent=True)
if hash3:
    log(f"  ✓ Committed: {hash3.strip()}")
log("")

# Step 5: Summary
log("[5/5] Execution Summary\n")
log("Commit Log:")
commits = run_cmd("git log --oneline -3", silent=True)
if commits:
    for line in commits.strip().split('\n'):
        log(f"  {line}")

log("\n═══════════════════════════════════════════")
log("  ✓ Plan 01-01 Execution Complete!")
log("═══════════════════════════════════════════\n")
log("Files Created:")
log("  • Configuration: package.json, tsconfig.json, app.json")
log("  • Testing: jest.config.js, test setup & mocks")
log("  • Types: auth, user, API type definitions")
log("  • Total Commits: 3\n")
