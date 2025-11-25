'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { User } from '../app/shared/types';
import { apiClient } from '../lib/api/client';
import { API_BASE_URL } from '../constants';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,  // Start as loading to prevent premature redirects
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side after mount
    if (typeof window === 'undefined' || !mounted) return;
    
    console.log('[AuthProvider] Checking authentication...');
    
    // Check for existing auth token on mount
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    console.log('[AuthProvider] Token exists:', !!token, 'Stored user exists:', !!storedUser);
    
    if (token && storedUser) {
      // We have both token and user data - restore session immediately
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('[AuthProvider] Restoring session from localStorage for:', parsedUser.email);
        dispatch({ type: 'SET_USER', payload: parsedUser });
        
        // Validate token in background (don't block UI)
        validateToken();
      } catch (error) {
        console.error('[AuthProvider] Failed to parse stored user:', error);
        // If parsing fails, validate from server
        validateToken();
      }
    } else if (token) {
      // We have token but no user - validate from server
      console.log('[AuthProvider] Token exists but no user data, validating...');
      validateToken();
    } else {
      // No token - not authenticated
      console.log('[AuthProvider] No token found - user not authenticated');
      dispatch({ type: 'LOGIN_FAILURE', payload: 'No token found' });
    }
  }, [mounted]);

  const validateToken = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      console.log('[AuthProvider] Validating token with server...');
      const userResponse = await apiClient.get<User>('/users/profile');
      // Store user data for offline access
      localStorage.setItem('user', JSON.stringify(userResponse));
      dispatch({ type: 'SET_USER', payload: userResponse });
      console.log('[AuthProvider] Token validated successfully for:', userResponse.email);
    } catch (error: unknown) {
      console.error('[AuthProvider] Token validation error:', error);
      // Check if it's an axios error with 401/403 status
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        // Only logout on actual authentication errors
        console.log('[AuthProvider] Auth error (401/403) - logging out');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
        dispatch({ type: 'LOGOUT' });
      } else {
        // For other errors (network, server down), keep the session alive with stored data
        console.log('[AuthProvider] Network error during validation - keeping session alive');
        // Don't logout on network errors - user is still logged in
        // The stored user data has already been set, so do nothing
      }
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Create form data for OAuth2 login
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      // Login API call
      const loginResponse = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        body: formData,
      });

      if (!loginResponse.ok) {
        throw new Error('Invalid credentials');
      }

      const { access_token } = await loginResponse.json();
      localStorage.setItem('authToken', access_token);

      // Get user profile
      const userResponse = await apiClient.get<User>('/users/profile');
      
      // Store user data for offline access
      localStorage.setItem('user', JSON.stringify(userResponse));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: userResponse });
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error instanceof Error ? error.message : 'Login failed' 
      });
      throw error;
    }
  };

  const logout = (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}