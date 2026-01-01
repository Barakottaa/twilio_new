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
      
      // Final fallback to Twilio
      return await getTwilioConversations(agentId, limit);
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
// Note: This function is currently unused but kept for potential future use
function initializeConversations(conversations: Chat[]): void {
  console.log('🔄 Initializing conversations:', conversations.length);
  // This function is used by the client to initialize conversations
  // The actual initialization logic is handled by the client state management
}

export default ConversationService;