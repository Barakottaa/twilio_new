import { create } from 'zustand';
import type { Conversation, Message, TwilioNumber } from '../types';
import { apiService } from '../services/api';

interface ChatState {
  conversations: Conversation[];
  selectedConversationId: string | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;
  selectedNumberId: string | null;
  numbers: TwilioNumber[];
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setSelectedConversation: (id: string | null) => void;
  setSelectedNumber: (numberId: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateConversation: (conversation: Conversation) => void;
  loadConversations: (numberId?: string) => Promise<void>;
  loadNumbers: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  selectedConversationId: null,
  messages: {},
  isLoading: false,
  error: null,
  selectedNumberId: null,
  numbers: [],

  setConversations: (conversations) => {
    set({ conversations });
  },

  setSelectedConversation: (id) => {
    set({ selectedConversationId: id });
    if (id) {
      // Load messages if not already loaded
      const messages = get().messages[id];
      if (!messages || messages.length === 0) {
        get().loadMessages(id);
      }
      // Mark as read
      get().markAsRead(id);
    }
  },

  setSelectedNumber: (numberId) => {
    set({ selectedNumberId: numberId });
    // Reload conversations when number changes
    if (numberId) {
      get().loadConversations(numberId);
    }
  },

  addMessage: (conversationId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    }));
  },

  updateConversation: (conversation) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversation.id ? conversation : c
      ),
    }));
  },

  loadConversations: async (numberId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await apiService.getConversations(numberId || get().selectedNumberId || undefined);
      set({ conversations, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load conversations', isLoading: false });
    }
  },

  loadNumbers: async () => {
    try {
      const numbers = await apiService.getNumbers();
      set({ numbers });
      // Auto-select first number if none selected
      if (!get().selectedNumberId && numbers.length > 0) {
        set({ selectedNumberId: numbers[0].id });
        // Load conversations for the first number
        get().loadConversations(numbers[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load numbers:', error);
    }
  },

  loadMessages: async (conversationId) => {
    try {
      const messages = await apiService.getMessages(conversationId);
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: messages,
        },
      }));
    } catch (error: any) {
      console.error('Failed to load messages:', error);
    }
  },

  sendMessage: async (conversationId, text) => {
    try {
      const message = await apiService.sendMessage(conversationId, text);
      get().addMessage(conversationId, message);
      
      // Update conversation's last message
      const conversation = get().conversations.find((c) => c.id === conversationId);
      if (conversation) {
        get().updateConversation({
          ...conversation,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      throw error;
    }
  },

  markAsRead: async (conversationId) => {
    try {
      await apiService.markConversationRead(conversationId);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      }));
    } catch (error) {
      // Ignore errors
    }
  },
}));

