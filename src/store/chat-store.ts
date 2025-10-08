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
  isPinned?: boolean;
  isNew?: boolean;
  isUnreplied?: boolean;
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
  
  // Message status updates
  updateMessageStatus: (conversationId: string, messageId: string, status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered') => void;
  updateMessageAfterSend: (conversationId: string, tempMessageId: string, updates: { id: string; twilioMessageSid?: string; deliveryStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered' }) => void;
  
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
  setConversations: (newConversations) => set((state) => {
    console.log('🔍 setConversations called with:', newConversations.length, 'conversations');
    
    // Merge new conversations with existing ones to preserve real-time updates
    const mergedConversations = newConversations.map((newConv: any) => {
      const existingConv = state.conversations.find(conv => conv.id === newConv.id);
      if (existingConv) {
        // Preserve real-time updates from existing conversation
        return {
          ...newConv,
          lastMessagePreview: existingConv.lastMessagePreview || newConv.lastMessagePreview,
          updatedAt: existingConv.updatedAt || newConv.updatedAt,
          isUnreplied: existingConv.isUnreplied !== undefined ? existingConv.isUnreplied : newConv.isUnreplied,
          unreadCount: existingConv.unreadCount || newConv.unreadCount,
          isNew: existingConv.isNew !== undefined ? existingConv.isNew : newConv.isNew
        };
      }
      return newConv;
    });
    
    console.log('🔍 setConversations - merged conversations:', mergedConversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      lastMessagePreview: conv.lastMessagePreview,
      isUnreplied: conv.isUnreplied
    })));
    
    return { conversations: mergedConversations };
  }),
  
  setSelectedConversation: (id) => {
    console.log('🔍 ChatStore - setSelectedConversation:', id);
    set({ selectedConversationId: id });
  },
  
  appendMessage: (conversationId, message) => set((state) => {
    console.log('🔥 appendMessage called:', { conversationId, messageId: message.id, text: message.text });
    
    const currentMessages = state.messages[conversationId] || [];
    
    // Enhanced duplicate detection using multiple criteria
    const messageExists = currentMessages.some(m => {
      // Check by message ID
      if (m.id === message.id) return true;
      
      // Check by Twilio message SID if available
      if (m.twilioMessageSid && message.twilioMessageSid && m.twilioMessageSid === message.twilioMessageSid) return true;
      
      // Check by exact same content, sender, and timestamp (within 5 seconds)
      if (m.text === message.text && 
          m.sender === message.sender &&
          m.senderId === message.senderId &&
          Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000) {
        return true;
      }
      
      return false;
    });
    
    if (messageExists) {
      console.log('🔥 Duplicate message detected, skipping:', {
        messageId: message.id,
        twilioSid: message.twilioMessageSid,
        text: message.text
      });
      return state; // No change needed
    }
    
    console.log('🔥 Appending new message. Current count:', currentMessages.length);
    
    // Create a new array with the new message to ensure React detects the change
    const updatedMessages = [...currentMessages, message];
    
    console.log('🔥 Updated count:', updatedMessages.length);
    
    // Check if this is an incoming message (from customer) vs outgoing (from agent)
    const isIncomingMessage = message.sender === 'customer';
    
    // Update last message preview for the conversation
    const updatedConversations = state.conversations.map(conv => {
      if (conv.id === conversationId) {
        const wasClosed = conv.status === 'closed';
        const newIsUnreplied = isIncomingMessage ? true : 
                              !isIncomingMessage ? false : conv.isUnreplied;
        
        console.log('🔍 appendMessage - updating conversation:', {
          conversationId,
          conversationTitle: conv.title,
          isIncomingMessage,
          wasClosed,
          newStatus: (wasClosed && isIncomingMessage) ? 'open' : conv.status,
          newIsUnreplied,
          messageText: message.text
        });
        
        return { 
          ...conv, 
          lastMessagePreview: message.text || '[Media]', 
          updatedAt: message.timestamp,
          // Only auto-reopen closed conversations when INCOMING messages are received
          status: (wasClosed && isIncomingMessage) ? 'open' : conv.status,
          // Mark as unreplied if this is an incoming message and conversation is open
          // Clear unreplied status if this is an outgoing agent message
          isUnreplied: newIsUnreplied
        };
      }
      return conv;
    });

    // Log the final updated conversation state
    const updatedConv = updatedConversations.find(conv => conv.id === conversationId);
    if (updatedConv) {
      console.log('🔍 appendMessage - final conversation state:', {
        conversationId,
        title: updatedConv.title,
        lastMessagePreview: updatedConv.lastMessagePreview,
        isUnreplied: updatedConv.isUnreplied,
        status: updatedConv.status,
        updatedAt: updatedConv.updatedAt
      });
    }

    // Auto-reopen in database if conversation was closed AND this is an incoming message
    const conversation = state.conversations.find(conv => conv.id === conversationId);
    if (conversation && conversation.status === 'closed' && isIncomingMessage) {
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
    
    // Update last message preview with the newest message
    const lastMessage = uniqueNewMessages[uniqueNewMessages.length - 1];
    const isIncomingMessage = lastMessage.sender === 'customer';
    
    const updatedConversations = state.conversations.map(conv => 
      conv.id === conversationId && lastMessage
        ? { 
            ...conv, 
            lastMessagePreview: lastMessage.text || '[Media]', 
            updatedAt: lastMessage.timestamp,
            // Only auto-reopen closed conversations when INCOMING messages are received
            status: (conv.status === 'closed' && isIncomingMessage) ? 'open' : conv.status
          }
        : conv
    );

    // Auto-reopen in database if conversation was closed AND this is an incoming message
    const conversation = state.conversations.find(conv => conv.id === conversationId);
    if (conversation && conversation.status === 'closed' && isIncomingMessage) {
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
  
  // Message status updates
  updateMessageStatus: (conversationId, messageId, status) => set((state) => {
    console.log('🔍 ChatStore - updateMessageStatus:', { conversationId, messageId, status });
    const messages = state.messages[conversationId] || [];
    const updatedMessages = messages.map(msg => 
      msg.id === messageId 
        ? { ...msg, deliveryStatus: status }
        : msg
    );
    
    return {
      messages: { ...state.messages, [conversationId]: updatedMessages }
    };
  }),
  
  updateMessageAfterSend: (conversationId, tempMessageId, updates) => set((state) => {
    console.log('🔍 ChatStore - updateMessageAfterSend:', { conversationId, tempMessageId, updates });
    const messages = state.messages[conversationId] || [];
    const updatedMessages = messages.map(msg => 
      msg.id === tempMessageId 
        ? { 
            ...msg, 
            id: updates.id,
            twilioMessageSid: updates.twilioMessageSid,
            deliveryStatus: updates.deliveryStatus
          }
        : msg
    );
    
    // Remove green indicator from conversation since agent has now replied
    const updatedConversations = state.conversations.map(conv => 
      conv.id === conversationId 
        ? { ...conv, isNew: false }
        : conv
    );
    
    return {
      messages: { ...state.messages, [conversationId]: updatedMessages },
      conversations: updatedConversations
    };
  }),
  
  // assignment & status actions
  setAssignment: (conversationId, agent) => set((state) => {
    console.log('🔍 ChatStore - setAssignment:', { conversationId, agent, previousAssignment: state.assignments[conversationId] });
    return {
      assignments: { ...state.assignments, [conversationId]: agent }
    };
  }),
  
  setStatus: (conversationId, status) => set((state) => {
    console.log('🔍 ChatStore - setStatus:', { conversationId, status, previousStatus: state.statuses[conversationId] });
    return {
      statuses: { ...state.statuses, [conversationId]: status }
    };
  }),
  
        setMe: (agent) => set({ me: agent }),

        // Load assignments from database via API
        loadAssignmentsFromDatabase: async () => {
          try {
            console.log('🔍 Loading assignments from database...');
            const response = await fetch('/api/assignments');
            if (response.ok) {
              const data = await response.json();
              console.log('🔍 Raw API response:', data);
              console.log('🔍 Raw assignments object:', data.assignments);
              console.log('🔍 Raw statuses object:', data.statuses);
              set({ assignments: data.assignments, statuses: data.statuses });
              console.log('🔍 Loaded assignments from database:', { assignments: data.assignments, statuses: data.statuses });
            } else {
              console.error('Failed to load assignments from database:', response.status, response.statusText);
            }
          } catch (error) {
            console.error('Error loading assignments from database:', error);
          }
        },

        // Update conversation status
        updateConversationStatus: (conversationId, status) => set((state) => {
          console.log('🔍 ChatStore - updateConversationStatus:', { conversationId, status, previousStatus: state.statuses[conversationId] });
          const updatedConversations = state.conversations.map(conv => {
            if (conv.id === conversationId) {
              // If conversation is being reopened from closed, we'll let the API handle
              // whether it should be marked as new (based on agent replies)
              return { 
                ...conv, 
                status, 
                updatedAt: new Date().toISOString()
                // Note: isNew will be updated by the API response
              };
            }
            return conv;
          });
          
          return {
            conversations: updatedConversations,
            statuses: { ...state.statuses, [conversationId]: status as "open" | "closed" }
          };
        }),

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
