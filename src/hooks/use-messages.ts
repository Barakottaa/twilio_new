import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types';
import { useChatStore } from '@/store/chat-store';
import { shallow } from 'zustand/shallow';

interface UseMessagesResult {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadOlder: () => void;
  refresh: () => void;
  error: string | null;
}

// Stable empty reference to avoid new snapshots every render
const EMPTY_MESSAGES: Message[] = Object.freeze([]);

export function useMessages(conversationId?: string): UseMessagesResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Select store actions - bring them into scope
  const setMessages = useChatStore((s) => s.setMessages);
  const clearConversation = useChatStore((s) => s.clearConversation);
  
  // Messages selector that returns stable references
  const messages = useChatStore(
    (state) => {
      if (!conversationId) return EMPTY_MESSAGES;
      // assuming you store messages under a per-conversation map
      return state.messages[conversationId] ?? EMPTY_MESSAGES;
    },
    shallow
  );

  const fetchMessages = useCallback(async (before?: string, append = false) => {
    if (!conversationId) return;
    
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        // Clear just this conversation before fetching
        setMessages(conversationId, []);
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
      
      // Update the store with fetched messages - REPLACE array reference, don't mutate
      if (append) {
        // For loading older messages, prepend to existing messages
        // Read from store directly to avoid stale closure
        const current = useChatStore.getState().messages[conversationId] ?? [];
        const mergedMessages = [...data.messages, ...current];
        setMessages(conversationId, mergedMessages);
      } else {
        // For initial load, set messages directly
        setMessages(conversationId, data.messages);
      }
      
      setNextBefore(data.nextBefore);
      setHasMore(data.hasMore);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [conversationId, setMessages]);

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
      // safest: just reset paging flags and skip resetting messages list
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
