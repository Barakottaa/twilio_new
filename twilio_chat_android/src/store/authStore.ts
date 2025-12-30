import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Agent } from '../types';
import { apiService } from '../services/api';

interface AuthState {
  agent: Agent | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const STORAGE_KEY = '@twilio_chat_auth';

export const useAuthStore = create<AuthState>((set, get) => ({
  agent: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    const result = await apiService.login(username, password);
    
    if (result.success && result.agent) {
      set({
        agent: result.agent,
        isAuthenticated: true,
        isLoading: false,
      });
      // Persist to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        agent: result.agent,
        isAuthenticated: true,
      }));
    } else {
      set({ isLoading: false });
    }
    
    return result;
  },

  logout: async () => {
    await apiService.logout();
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({
      agent: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    // Check stored auth first
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.agent && parsed.isAuthenticated) {
          set({
            agent: parsed.agent,
            isAuthenticated: true,
          });
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    
    // Verify with server
    const isAuth = await apiService.isAuthenticated();
    
    if (isAuth) {
      const agent = await apiService.getStoredAgent();
      if (agent) {
        set({
          agent,
          isAuthenticated: true,
        });
      } else {
        set({
          agent: null,
          isAuthenticated: false,
        });
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } else {
      set({
        agent: null,
        isAuthenticated: false,
      });
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
    
    set({ isLoading: false });
  },
}));
