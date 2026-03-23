import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import { favoritesService } from '../services/favoritesService';
import type { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const existingUser = await authService.checkSession();
      setUser(existingUser);
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const userData = await authService.login(email, password);
    setUser(userData);
    
    // Sync favorites after successful login (non-blocking)
    favoritesService.syncFromBackend().catch(err => {
      console.error('[AuthContext] Failed to sync favorites on login:', err);
    });
  };

  const register = async (email: string, password: string, displayName: string) => {
    const userData = await authService.register(email, password, displayName);
    setUser(userData);
    
    // Sync favorites after successful registration (non-blocking)
    favoritesService.syncFromBackend().catch(err => {
      console.error('[AuthContext] Failed to sync favorites on register:', err);
    });
  };

  const logout = async () => {
    // Clear favorites before logout
    await favoritesService.clearAllFavorites();
    
    await authService.logout();
    setUser(null);
  };

  const refreshSession = async () => {
    await authService.refreshToken();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshSession }}
    >
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
