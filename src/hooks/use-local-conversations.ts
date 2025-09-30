'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Chat, Message } from '@/types';
// Client-side conversation management with local caching

interface UseLocalConversationsProps {
  agentId: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useLocalConversations({
  agentId,
  limit = 20,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: UseLocalConversationsProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      
      // Fetch from API with enhanced caching
      const response = await fetch(`/api/twilio/conversations?agentId=${agentId}&limit=${limit}&forceRefresh=${forceRefresh}`, {
        headers: {
          'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=60',
          'Pragma': forceRefresh ? 'no-cache' : ''
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch conversations');
      }

      setChats(data.conversations);
      setLastSync(new Date());
      setLoading(false);
      
      console.log(`✅ ${forceRefresh ? 'Refreshed' : 'Synced'} ${data.conversations.length} conversations (cached: ${data.cached})`);
      
    } catch (err) {
      console.error('❌ Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [agentId, limit]);

  const addMessage = useCallback(async (conversationId: string, message: Message) => {
    try {
      // Update local state immediately for instant UI update
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === conversationId 
            ? { ...chat, messages: [...chat.messages, message] }
            : chat
        )
      );
      
      console.log('✅ Message added to local state');
    } catch (error) {
      console.error('❌ Error adding message to local state:', error);
    }
  }, []);

  const refreshConversations = useCallback(() => {
    fetchConversations(true);
  }, [fetchConversations]);

  const getMessages = useCallback(async (conversationId: string, messageLimit = 100): Promise<Message[]> => {
    try {
      // Find conversation and return its messages
      const chat = chats.find(c => c.id === conversationId);
      return chat ? chat.messages.slice(-messageLimit) : [];
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      return [];
    }
  }, [chats]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    intervalRef.current = setInterval(() => {
      fetchConversations(false);
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchConversations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    chats,
    loading,
    error,
    lastSync,
    refreshConversations,
    addMessage,
    getMessages,
    isStale: lastSync ? (Date.now() - lastSync.getTime()) > 300000 : true // 5 minutes
  };
}
