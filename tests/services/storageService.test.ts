import { storageService } from '../../src/services/storageService';
import * as SecureStore from 'expo-secure-store';

// Mock expo-secure-store directly in this test file
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

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
