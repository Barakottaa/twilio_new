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
  // Additional information for enhanced display
  customerPhone?: string;
  customerEmail?: string;
  agentName?: string;
  agentStatus?: string;
  status?: 'open' | 'closed' | 'pending';
  priority?: 'low' | 'medium' | 'high';
}

interface ChatState {
  conversations: ConversationItem[];
  messages: Record<string, Message[]>; // conversationId -> messages
  selectedConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // assignment & status for the header
  assignments: Record<string, { id: string; name: string } | null>;
  statuses: Record<string, "open" | "closed">;
  
  // Optional: current logged-in agent
  me: { id: string; name: string } | null;
  
  // Note: Pin status is now stored in database, not in local state
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
  clearConversation: (conversationId: string) => void;
  
  // assignment & status actions
  setAssignment: (conversationId: string, agent: { id: string; name: string } | null) => void;
  setStatus: (conversationId: string, status: "open" | "closed") => void;
  setMe: (agent: { id: string; name: string } | null) => void;
  loadAssignmentsFromDatabase: () => Promise<void>;
  
  // conversation property updates
  updateConversationStatus: (conversationId: string, status: 'open' | 'closed' | 'pending') => void;
  updateConversationPriority: (conversationId: string, priority: 'low' | 'medium' | 'high') => void;
  toggleConversationPin: (conversationId: string) => void;
  isConversationPinned: (conversationId: string) => boolean;
  autoReopenConversation: (conversationId: string) => Promise<void>;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  conversations: [],
  messages: {},
  selectedConversationId: null,
  isLoading: false,
  error: null,
  
  // assignment & status initial state
  assignments: {},
  statuses: {},
  me: null,
  
  // Note: Pin status is now stored in database, not in local state

  // Actions
  setConversations: (conversations) => set({ conversations }),
  
  setSelectedConversation: (id) => {
    console.log('🔍 ChatStore - setSelectedConversation:', id);
    set({ selectedConversationId: id });
  },
  
  appendMessage: (conversationId, message) => set((state) => {
    console.log('🔥 appendMessage called:', { conversationId, messageId: message.id, text: message.text });
    
    const currentMessages = state.messages[conversationId] || [];
    
    // Check if message already exists to prevent duplicates
    const messageExists = currentMessages.some(m => m.id === message.id);
    if (messageExists) {
      console.log('🔥 Message already exists, skipping');
      return state; // No change needed
    }
    
    console.log('🔥 Appending new message. Current count:', currentMessages.length);
    
    // Create a new array with the new message to ensure React detects the change
    const updatedMessages = [...currentMessages, message];
    
    console.log('🔥 Updated count:', updatedMessages.length);
    
    // Update last message preview for the conversation and auto-reopen if closed
    const updatedConversations = state.conversations.map(conv => 
      conv.id === conversationId 
        ? { 
            ...conv, 
            lastMessagePreview: message.text || '[Media]', 
            updatedAt: message.timestamp,
            // Auto-reopen closed conversations when new messages are received
            status: conv.status === 'closed' ? 'open' : conv.status
          }
        : conv
    );

    // Auto-reopen in database if conversation was closed
    const conversation = state.conversations.find(conv => conv.id === conversationId);
    if (conversation && conversation.status === 'closed') {
      // Call auto-reopen function asynchronously
      get().autoReopenConversation(conversationId);
    }
    
    return {
      messages: { ...state.messages, [conversationId]: updatedMessages },
      conversations: updatedConversations
    };
  }),
  
  appendManyMessages: (conversationId, newMessages) => set((state) => {
    const currentMessages = state.messages[conversationId] || [];
    
    // Filter out messages that already exist
    const existingMessageIds = new Set(currentMessages.map(m => m.id));
    const uniqueNewMessages = newMessages.filter(m => !existingMessageIds.has(m.id));
    
    if (uniqueNewMessages.length === 0) {
      return state; // No new messages to add
    }
    
    const updatedMessages = [...currentMessages, ...uniqueNewMessages];
    
    // Update last message preview with the newest message and auto-reopen if closed
    const lastMessage = uniqueNewMessages[uniqueNewMessages.length - 1];
    const updatedConversations = state.conversations.map(conv => 
      conv.id === conversationId && lastMessage
        ? { 
            ...conv, 
            lastMessagePreview: lastMessage.text || '[Media]', 
            updatedAt: lastMessage.timestamp,
            // Auto-reopen closed conversations when new messages are received
            status: conv.status === 'closed' ? 'open' : conv.status
          }
        : conv
    );

    // Auto-reopen in database if conversation was closed
    const conversation = state.conversations.find(conv => conv.id === conversationId);
    if (conversation && conversation.status === 'closed') {
      // Call auto-reopen function asynchronously
      get().autoReopenConversation(conversationId);
    }
    
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
  }),
  
  clearConversation: (conversationId) => set((state) => ({
    messages: { ...state.messages, [conversationId]: [] }
  })),
  
  // assignment & status actions
  setAssignment: (conversationId, agent) => set((state) => ({
    assignments: { ...state.assignments, [conversationId]: agent }
  })),
  
  setStatus: (conversationId, status) => set((state) => ({
    statuses: { ...state.statuses, [conversationId]: status }
  })),
  
        setMe: (agent) => set({ me: agent }),

        // Load assignments from database via API
        loadAssignmentsFromDatabase: async () => {
          try {
            const response = await fetch('/api/assignments');
            if (response.ok) {
              const data = await response.json();
              set({ assignments: data.assignments, statuses: data.statuses });
              console.log('🔍 Loaded assignments from database:', { assignments: data.assignments, statuses: data.statuses });
            } else {
              console.error('Failed to load assignments from database');
            }
          } catch (error) {
            console.error('Error loading assignments from database:', error);
          }
        },

        // Update conversation status
        updateConversationStatus: (conversationId, status) => set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? { ...conv, status, updatedAt: new Date().toISOString() }
              : conv
          ),
          statuses: { ...state.statuses, [conversationId]: status }
        })),

        // Update conversation priority
        updateConversationPriority: (conversationId, priority) => set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId
              ? { ...conv, priority, updatedAt: new Date().toISOString() }
              : conv
          )
        })),

        // Toggle conversation pin
        toggleConversationPin: async (conversationId) => {
          try {
            // Find current conversation to get current pin status
            const state = get();
            const conversation = state.conversations.find(conv => conv.id === conversationId);
            const isCurrentlyPinned = conversation?.isPinned || false;
            const newPinStatus = !isCurrentlyPinned;

            console.log('🔍 Toggling conversation pin:', { conversationId, isCurrentlyPinned, newPinStatus });

            // Update database
            const response = await fetch(`/api/conversations/${conversationId}/pin`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ isPinned: newPinStatus }),
            });

            if (!response.ok) {
              throw new Error('Failed to update conversation pin status');
            }

            // Update local state
            set((state) => ({
              conversations: state.conversations.map(conv =>
                conv.id === conversationId
                  ? { ...conv, isPinned: newPinStatus, updatedAt: new Date().toISOString() }
                  : conv
              )
            }));

            console.log('🔍 Conversation pin status updated successfully');
          } catch (error) {
            console.error('Error toggling conversation pin:', error);
          }
        },

        // Check if conversation is pinned
        isConversationPinned: (conversationId) => {
          const state = get();
          const conversation = state.conversations.find(conv => conv.id === conversationId);
          return conversation?.isPinned || false;
        },

        // Auto-reopen closed conversation when new message is received
        autoReopenConversation: async (conversationId: string) => {
          try {
            const response = await fetch(`/api/conversations/${conversationId}/status`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: 'open' }),
            });

            if (response.ok) {
              console.log('🔍 Auto-reopened conversation:', conversationId);
            }
          } catch (error) {
            console.error('Error auto-reopening conversation:', error);
          }
        }
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
