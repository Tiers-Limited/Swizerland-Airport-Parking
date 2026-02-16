'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, apiCall } from '@/lib/api';
import type { User, LoginCredentials, RegisterData } from '@/types';

// Backend auth response structure
interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        return;
      }

      // /auth/me returns user directly in data (not nested under data.user)
      const response = await apiCall<User>('GET', '/auth/me');
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser();
      setIsLoading(false);
    };
    initAuth();
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiCall<AuthResponse>(
        'POST',
        '/auth/login',
        credentials
      );

      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(user);
        return { success: true };
      }

      return { 
        success: false, 
        error: response.error?.message || 'Login failed' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiCall<AuthResponse>(
        'POST',
        '/auth/register',
        data
      );

      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(user);
        return { success: true };
      }

      return { 
        success: false, 
        error: response.error?.message || 'Registration failed' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
