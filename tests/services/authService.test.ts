import { authService } from '../../src/services/authService';
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
