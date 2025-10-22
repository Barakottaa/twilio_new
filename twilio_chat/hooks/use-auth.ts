'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { safeJson } from '@/lib/safe-json';
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
      console.log('🔍 Checking authentication...');
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Important: include cookies
        cache: 'no-store', // Prevent caching
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log('🔍 Auth response status:', response.status);
      
      if (response.status === 401) {
        console.log('🔍 Not authenticated (401)');
        setAuthState({
          agent: null,
          isLoading: false,
          isAuthenticated: false
        });
        return;
      }
      
      if (response.ok) {
        const agentData = await safeJson(response);
        console.log('🔍 Authentication successful:', agentData);
        setAuthState({
          agent: agentData,
          isLoading: false,
          isAuthenticated: true
        });
      } else {
        console.log('🔍 Auth failed with status:', response.status);
        setAuthState({
          agent: null,
          isLoading: false,
          isAuthenticated: false
        });
      }
    } catch (error) {
      console.error('🔍 Auth check error:', error);
      setAuthState({
        agent: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  };

  const login = async (username: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', username);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ username, password }),
      });

      console.log('🔐 Login response status:', response.status);

      if (response.ok) {
        const data = await safeJson(response);
        console.log('🔐 Login successful:', data);
        setAuthState({
          agent: data.agent,
          isLoading: false,
          isAuthenticated: true
        });
        return { success: true, agent: data.agent };
      } else {
        const errorData = await safeJson(response);
        console.log('🔐 Login failed:', errorData);
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error('🔐 Login error:', error);
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
