'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { mutate } from 'swr';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const logoutStore = useAuthStore((state) => state.logout);

  useEffect(() => {
    const initAuth = async () => {
      const existingToken = typeof window !== 'undefined' ? localStorage.getItem('financeos_access_token') : null;
      if (existingToken) {
        try {
          // Verify token against active backend DB user
          const user: any = await api.get('/users/me');
          if (user && user.id) {
            setAuth(user, existingToken);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Existing token is stale or invalid, clearing authentication state...');
        }
      }

      // If no valid token, purge and end loading
      if (typeof window !== 'undefined') {
        localStorage.removeItem('financeos_access_token');
      }
      logoutStore();
      setIsLoading(false);
    };

    initAuth();
  }, [setAuth, logoutStore]);

  const login = async (username: string, password: string) => {
    const res: any = await api.post('/auth/login', { username, password });
    if (res?.accessToken) {
      localStorage.setItem('financeos_access_token', res.accessToken);
      setAuth(res.user || { id: 'admin', name: 'Admin', email: 'admin@hoorain.app' }, res.accessToken);
      await mutate(() => true); // Revalidate all active SWR queries
    } else {
      throw new Error('Login failed: invalid response from server');
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('financeos_access_token');
    }
    logoutStore();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
