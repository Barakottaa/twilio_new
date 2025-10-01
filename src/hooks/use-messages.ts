import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef(conversationId);
  
  // Update ref when conversationId changes
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);
  
  // Get messages directly from store with stable reference
  const messages = useChatStore((state) => {
    const currentId = conversationIdRef.current;
    if (!currentId) return [];
    return state.messages[currentId] || [];
  });

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
      
      // Update the store with fetched messages
      const store = useChatStore.getState();
      if (append) {
        // For loading older messages, prepend to existing messages
        const existingMessages = store.messages[conversationId] || [];
        const mergedMessages = [...data.messages, ...existingMessages];
        store.setMessages(conversationId, mergedMessages);
      } else {
        // For initial load, set messages directly
        store.setMessages(conversationId, data.messages);
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
      setNextBefore(null);
      setHasMore(true);
    }
  }, [conversationId, fetchMessages]);

  // Real-time messages are now handled by the chat store directly
  // This hook only manages fetched messages from the API

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
