import '@testing-library/jest-native/extend-expect';

// Mock expo-secure-store with plain implementation
jest.mock('expo-secure-store', () => ({
  setItemAsync: () => Promise.resolve(),
  getItemAsync: () => Promise.resolve(null),
  deleteItemAsync: () => Promise.resolve(),
}));

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({}));

// Silence console errors in tests
global.console = {
  ...console,
  error: () => {},
  warn: () => {},
};
