import '@testing-library/jest-native/extend-expect';

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
