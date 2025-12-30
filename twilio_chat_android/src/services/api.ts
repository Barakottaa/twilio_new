import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type { Agent, Conversation, Message, TwilioNumber, Contact } from '../types';

const STORAGE_KEY = '@twilio_chat_session';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const session = await AsyncStorage.getItem(STORAGE_KEY);
        if (session) {
          try {
            const parsed = JSON.parse(session);
            // For cookie-based auth, we might need to handle it differently
            // For now, we'll use the session cookie if available
            config.withCredentials = true;
          } catch (e) {
            // Ignore parse errors
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear session on unauthorized
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(username: string, password: string): Promise<{ success: boolean; agent?: Agent; error?: string }> {
    try {
      const response = await this.client.post(API_ENDPOINTS.LOGIN, {
        username,
        password,
      }, {
        withCredentials: true,
      });

      if (response.data.agent) {
        // Store session info
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          agent: response.data.agent,
          timestamp: Date.now(),
        }));
        return { success: true, agent: response.data.agent };
      }
      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      return { success: false, error: message };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post(API_ENDPOINTS.LOGOUT, {}, { withCredentials: true });
    } catch (error) {
      // Ignore logout errors
    } finally {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }

  async getCurrentUser(): Promise<Agent | null> {
    try {
      const response = await this.client.get(API_ENDPOINTS.ME, { withCredentials: true });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Conversation methods
  async getConversations(numberId?: string): Promise<Conversation[]> {
    const params = numberId ? { numberId } : {};
    const response = await this.client.get(API_ENDPOINTS.TWILIO_CONVERSATIONS, {
      params,
      withCredentials: true,
    });
    return response.data.conversations || response.data || [];
  }

  async getNumbers(): Promise<TwilioNumber[]> {
    const response = await this.client.get(API_ENDPOINTS.NUMBERS, { withCredentials: true });
    return response.data.numbers || [];
  }

  // Contact methods
  async getContacts(): Promise<Contact[]> {
    const response = await this.client.get(API_ENDPOINTS.CONTACTS, { withCredentials: true });
    return response.data || [];
  }

  async getContact(id: string): Promise<Contact> {
    const response = await this.client.get(API_ENDPOINTS.CONTACT_BY_ID(id), { withCredentials: true });
    return response.data;
  }

  async getConversation(id: string): Promise<Conversation> {
    const response = await this.client.get(API_ENDPOINTS.CONVERSATION_BY_ID(id), { withCredentials: true });
    return response.data;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await this.client.get(
      API_ENDPOINTS.CONVERSATION_MESSAGES(conversationId),
      { withCredentials: true }
    );
    return response.data.messages || response.data || [];
  }

  async sendMessage(conversationId: string, message: string): Promise<Message> {
    const response = await this.client.post(
      API_ENDPOINTS.TWILIO_CONVERSATION_MESSAGE(conversationId),
      {
        message,
        author: (await this.getStoredAgent())?.id,
      },
      { withCredentials: true }
    );
    
    // Ensure the response has all required Message fields
    const data = response.data;
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString();
    }
    if (!data.sender) {
      data.sender = 'agent';
    }
    if (!data.id) {
      data.id = data.messageId || `msg_${Date.now()}`;
    }
    
    return data as Message;
  }

  async assignConversation(conversationId: string, agentId: string): Promise<void> {
    await this.client.post(
      API_ENDPOINTS.CONVERSATION_ASSIGN(conversationId),
      { agentId },
      { withCredentials: true }
    );
  }

  async markConversationRead(conversationId: string): Promise<void> {
    await this.client.post(
      API_ENDPOINTS.CONVERSATION_MARK_READ(conversationId),
      {},
      { withCredentials: true }
    );
  }

  // Helper methods
  async getStoredAgent(): Promise<Agent | null> {
    try {
      const session = await AsyncStorage.getItem(STORAGE_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.agent || null;
      }
    } catch (e) {
      // Ignore errors
    }
    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    const agent = await this.getStoredAgent();
    if (!agent) return false;
    
    // Verify with server
    const currentUser = await this.getCurrentUser();
    return currentUser !== null;
  }
}

export const apiService = new ApiService();

