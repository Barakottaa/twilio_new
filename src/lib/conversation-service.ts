// Server-side conversation service with enhanced caching
import type { Chat } from '@/types';
import { getTwilioConversations, invalidateConversationCache } from './twilio-service';

// Enhanced cache for conversations to reduce API calls
const conversationCache = new Map<string, { data: Chat[], timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

export class ConversationService {
  static async getConversations(
    agentId: string, 
    limit: number = 20, 
    forceRefresh: boolean = false
  ): Promise<Chat[]> {
    try {
      // Check cache first
      const cacheKey = `${agentId}-${limit}`;
      const cached = conversationCache.get(cacheKey);
      const now = Date.now();
      
      if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log("📦 Using cached conversations");
        return cached.data;
      }

      console.log('🔄 Syncing conversations from Twilio...');
      
      // Fetch from Twilio
      const twilioConversations = await getTwilioConversations(agentId, limit);
      
      // Cache the results
      conversationCache.set(cacheKey, {
        data: twilioConversations,
        timestamp: now
      });
      
      console.log(`✅ Synced ${twilioConversations.length} conversations`);
      return twilioConversations;
    } catch (error) {
      console.error('❌ Error in ConversationService:', error);
      
      // Fallback to cache on error
      const cacheKey = `${agentId}-${limit}`;
      const cached = conversationCache.get(cacheKey);
      if (cached) {
        console.log('📦 Using cached fallback data');
        return cached.data;
      }
      
      // No fallback - return empty array if Twilio fails
      console.log('📦 No conversations available - Twilio service failed');
      return [];
    }
  }

  static async invalidateCache(conversationId?: string): Promise<void> {
    if (conversationId) {
      // Clear specific conversation cache
      for (const [key, value] of conversationCache.entries()) {
        if (key.includes(conversationId)) {
          conversationCache.delete(key);
        }
      }
      console.log(`🗑️ Invalidated cache for conversation: ${conversationId}`);
    } else {
      // Clear all cache
      conversationCache.clear();
      console.log('🗑️ Invalidated all cache');
    }
    
    // Also invalidate Twilio cache
    await invalidateConversationCache(conversationId);
  }

  static async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, value] of conversationCache.entries()) {
      if ((now - value.timestamp) > CACHE_DURATION * 10) { // 5 minutes
        conversationCache.delete(key);
      }
    }
  }
}

// Initialize conversations function for client-side usage
export function initializeConversations(conversations: Chat[]): void {
  console.log('🔄 Initializing conversations:', conversations.length);
  // This function is used by the client to initialize conversations
  // The actual initialization logic is handled by the client state management
}

// Additional exports for API routes
export async function getAllConversations(): Promise<Chat[]> {
  return ConversationService.getConversations('', 100);
}

export async function getConversationsByStatus(status: string): Promise<Chat[]> {
  const all = await getAllConversations();
  return all.filter(chat => chat.status === status);
}

export async function getConversationsByAgent(agentId: string): Promise<Chat[]> {
  return ConversationService.getConversations(agentId, 100);
}

export async function getConversationsByPriority(priority: string): Promise<Chat[]> {
  const all = await getAllConversations();
  return all.filter(chat => chat.priority === priority);
}

export async function searchConversations(query: string): Promise<Chat[]> {
  const all = await getAllConversations();
  return all.filter(chat => 
    chat.contactName?.toLowerCase().includes(query.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(query.toLowerCase())
  );
}

export async function getConversationStats(): Promise<{ total: number; open: number; closed: number }> {
  const all = await getAllConversations();
  return {
    total: all.length,
    open: all.filter(chat => chat.status === 'open').length,
    closed: all.filter(chat => chat.status === 'closed').length
  };
}

export async function getConversationById(id: string): Promise<Chat | null> {
  const all = await getAllConversations();
  return all.find(chat => chat.id === id) || null;
}

export async function assignConversation(conversationId: string, agentId: string): Promise<void> {
  // This would typically update the conversation assignment in the database
  // For now, we'll just invalidate the cache
  await ConversationService.invalidateCache(conversationId);
}

export default ConversationService;