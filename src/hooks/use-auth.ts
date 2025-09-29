'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Agent } from '@/types';

interface AuthState {
  agent: Agent | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    agent: null,
    isLoading: true,
    isAuthenticated: false
  });
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Important: include cookies
        cache: 'no-store', // Prevent caching
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const agentData = await response.json();
        setAuthState({
          agent: agentData,
          isLoading: false,
          isAuthenticated: true
        });
      } else {
        setAuthState({
          agent: null,
          isLoading: false,
          isAuthenticated: false
        });
        // Don't redirect here, let the component decide
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        agent: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          agent: data.agent,
          isLoading: false,
          isAuthenticated: true
        });
        return { success: true, agent: data.agent };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Important: include cookies
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        agent: null,
        isLoading: false,
        isAuthenticated: false
      });
      router.push('/login');
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkAuth
  };
}
