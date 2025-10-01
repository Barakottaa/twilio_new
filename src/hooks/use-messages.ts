import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types';
import { useChatStore } from '@/store/chat-store';

interface UseMessagesResult {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadOlder: () => void;
  refresh: () => void;
  error: string | null;
}

export function useMessages(conversationId?: string): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get real-time messages from the store
  const storeMessages = useChatStore(state => conversationId ? state.messages[conversationId] || [] : []);

  const fetchMessages = useCallback(async (before?: string, append = false) => {
    if (!conversationId) return;
    
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setMessages([]);
      }
      setError(null);
      
      const url = new URL('/api/twilio/messages', window.location.origin);
      url.searchParams.set('conversationId', conversationId);
      url.searchParams.set('limit', '25');
      if (before) {
        url.searchParams.set('before', before);
      }
      
      const response = await fetch(url.toString());
      console.log('🔍 Messages API response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      console.log('🔍 Messages API data:', data);
      
      console.log('🔍 Setting messages:', { count: data.messages.length, append, firstMessage: data.messages[0] });
      
      // Merge with real-time messages from store
      const mergedMessages = [...data.messages];
      if (storeMessages.length > 0) {
        // Add real-time messages that aren't already in the fetched messages
        const fetchedMessageIds = new Set(data.messages.map(m => m.id));
        const newRealtimeMessages = storeMessages.filter(m => !fetchedMessageIds.has(m.id));
        mergedMessages.push(...newRealtimeMessages);
      }
      
      if (append) {
        setMessages(prev => [...mergedMessages, ...prev]);
      } else {
        setMessages(mergedMessages);
      }
      
      setNextBefore(data.nextBefore);
      setHasMore(data.hasMore);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [conversationId]);

  const loadOlder = useCallback(() => {
    if (hasMore && nextBefore && !isLoadingMore) {
      fetchMessages(nextBefore, true);
    }
  }, [hasMore, nextBefore, isLoadingMore, fetchMessages]);

  const refresh = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Load initial messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    } else {
      setMessages([]);
      setNextBefore(null);
      setHasMore(true);
    }
  }, [conversationId, fetchMessages]);

  // Listen for real-time message updates
  useEffect(() => {
    if (conversationId && storeMessages.length > 0) {
      console.log('🔍 Real-time messages updated:', storeMessages.length);
      setMessages(prev => {
        // Merge real-time messages with existing messages
        const existingMessageIds = new Set(prev.map(m => m.id));
        const newRealtimeMessages = storeMessages.filter(m => !existingMessageIds.has(m.id));
        return [...prev, ...newRealtimeMessages];
      });
    }
  }, [conversationId, storeMessages]);

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadOlder,
    refresh,
    error
  };
}
