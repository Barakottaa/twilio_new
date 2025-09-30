import { create } from 'zustand';
import { Message, Chat } from '@/types';

interface ConversationItem {
  id: string;
  title: string;
  lastMessagePreview: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  agentId: string;
}

interface ChatState {
  conversations: ConversationItem[];
  messages: Record<string, Message[]>; // conversationId -> messages
  selectedConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ChatActions {
  setConversations: (conversations: ConversationItem[]) => void;
  setSelectedConversation: (id: string | null) => void;
  appendMessage: (conversationId: string, message: Message) => void;
  appendManyMessages: (conversationId: string, messages: Message[]) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  updateLastMessage: (conversationId: string, message: Message) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: (conversationId: string) => void;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  conversations: [],
  messages: {},
  selectedConversationId: null,
  isLoading: false,
  error: null,

  // Actions
  setConversations: (conversations) => set({ conversations }),
  
  setSelectedConversation: (id) => {
    console.log('🔍 ChatStore - setSelectedConversation:', id);
    set({ selectedConversationId: id });
  },
  
  appendMessage: (conversationId, message) => set((state) => {
    const currentMessages = state.messages[conversationId] || [];
    const updatedMessages = [...currentMessages, message];
    
    // Update last message preview for the conversation
    const updatedConversations = state.conversations.map(conv => 
      conv.id === conversationId 
        ? { ...conv, lastMessagePreview: message.text || '[Media]', updatedAt: message.timestamp }
        : conv
    );
    
    return {
      messages: { ...state.messages, [conversationId]: updatedMessages },
      conversations: updatedConversations
    };
  }),
  
  appendManyMessages: (conversationId, newMessages) => set((state) => {
    const currentMessages = state.messages[conversationId] || [];
    const updatedMessages = [...currentMessages, ...newMessages];
    
    // Update last message preview with the newest message
    const lastMessage = newMessages[newMessages.length - 1];
    const updatedConversations = state.conversations.map(conv => 
      conv.id === conversationId && lastMessage
        ? { ...conv, lastMessagePreview: lastMessage.text || '[Media]', updatedAt: lastMessage.timestamp }
        : conv
    );
    
    return {
      messages: { ...state.messages, [conversationId]: updatedMessages },
      conversations: updatedConversations
    };
  }),
  
  setMessages: (conversationId, messages) => set((state) => ({
    messages: { ...state.messages, [conversationId]: messages }
  })),
  
  updateLastMessage: (conversationId, message) => set((state) => {
    const updatedConversations = state.conversations.map(conv => 
      conv.id === conversationId 
        ? { ...conv, lastMessagePreview: message.text || '[Media]', updatedAt: message.timestamp }
        : conv
    );
    
    return { conversations: updatedConversations };
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  clearMessages: (conversationId) => set((state) => {
    const { [conversationId]: _, ...remainingMessages } = state.messages;
    return { messages: remainingMessages };
  })
}));

// Batched update utility
class MessageBatcher {
  private queue: Array<{ conversationId: string; message: Message }> = [];
  private timeout: NodeJS.Timeout | null = null;
  private readonly batchDelay = 60; // 60ms

  enqueue(conversationId: string, message: Message) {
    this.queue.push({ conversationId, message });
    
    if (this.timeout) return;
    
    this.timeout = setTimeout(() => {
      this.flush();
    }, this.batchDelay);
  }

  private flush() {
    if (this.queue.length === 0) return;
    
    const batches: Record<string, Message[]> = {};
    
    // Group messages by conversation
    this.queue.forEach(({ conversationId, message }) => {
      if (!batches[conversationId]) {
        batches[conversationId] = [];
      }
      batches[conversationId].push(message);
    });
    
    // Apply batches
    const store = useChatStore.getState();
    Object.entries(batches).forEach(([conversationId, messages]) => {
      store.appendManyMessages(conversationId, messages);
    });
    
    // Clear queue
    this.queue = [];
    this.timeout = null;
  }
}

export const messageBatcher = new MessageBatcher();
