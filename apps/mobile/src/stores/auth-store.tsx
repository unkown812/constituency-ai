import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '@/src/lib/api';
import { CONFIG } from '@/src/constants/config';
import { Profile, AuthTokens } from '@/src/types';

interface AuthState {
  token: string | null;
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  setTokens: (tokens: AuthTokens) => Promise<void>;
  setUser: (user: Profile) => void;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const loadStoredAuth = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(CONFIG.AUTH_TOKEN_KEY);
      if (token) {
        setState((prev) => ({ ...prev, token, isAuthenticated: true, isLoading: false }));
        try {
          const response = await api.get<Profile>('/profile');
          setState((prev) => ({ ...prev, user: response.data, isLoading: false }));
        } catch {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const setTokens = useCallback(async (tokens: AuthTokens) => {
    await SecureStore.setItemAsync(CONFIG.AUTH_TOKEN_KEY, tokens.access_token);
    await SecureStore.setItemAsync(CONFIG.REFRESH_TOKEN_KEY, tokens.refresh_token);
    setState((prev) => ({ ...prev, token: tokens.access_token, isAuthenticated: true }));
  }, []);

  const setUser = useCallback((user: Profile) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(CONFIG.AUTH_TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(CONFIG.REFRESH_TOKEN_KEY).catch(() => {});
    setState({ token: null, user: null, isLoading: false, isAuthenticated: false });
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  return (
    <AuthContext.Provider value={{ ...state, setTokens, setUser, logout, loadStoredAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
