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

// Stable empty reference to avoid new snapshots every render
const EMPTY_MESSAGES = Object.freeze([]) as unknown as Message[];

export function useMessages(conversationId?: string): UseMessagesResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // In-flight guard per conversation to avoid double fetch & loops
  const inflightFor = useRef<string | null>(null);

  const setMessages = useChatStore((s) => s.setMessages);
  // (You can keep clearConversation if you need it somewhere else)
  // const clearConversation = useChatStore((s) => s.clearConversation);

  // ✅ Subscribe to messages for this specific conversation
  const messages = useChatStore((state) => {
    if (!conversationId) return EMPTY_MESSAGES;
    const msgs = state.messages[conversationId];
    console.log('🔥 useMessages selector called for conversation:', conversationId, 'count:', msgs?.length || 0, 'exists:', !!msgs);
    return msgs ?? EMPTY_MESSAGES;
  });

  const fetchMessages = useCallback(
    async (before?: string, append = false) => {
      if (!conversationId) return;
      if (inflightFor.current === conversationId) return; // already fetching this chat

      inflightFor.current = conversationId;
      try {
        if (append) setIsLoadingMore(true);
        else setIsLoading(true);

        setError(null);

        const url = new URL('/api/twilio/messages', window.location.origin);
        url.searchParams.set('conversationId', conversationId);
        url.searchParams.set('limit', '25');
        if (before) url.searchParams.set('before', before);

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Failed to fetch messages');

        const data = await response.json();

        if (append) {
          // Prepend older messages
          const current = useChatStore.getState().messages[conversationId] ?? EMPTY_MESSAGES;
          const merged = [...data.messages, ...current];
          setMessages(conversationId, merged);
        } else {
          // ✅ Merge with existing messages to preserve real-time updates
          const current = useChatStore.getState().messages[conversationId] ?? EMPTY_MESSAGES;
          const apiMessages = data.messages ?? EMPTY_MESSAGES;
          
          // Create a map of existing messages by ID for quick lookup
          const existingMessagesMap = new Map(current.map(m => [m.id, m]));
          
          // Merge API messages with existing real-time messages
          // API messages take precedence for ordering, but preserve real-time messages that aren't in API
          const mergedMessages: Message[] = [];
          const processedIds = new Set<string>();
          
          // First, add all API messages (they represent the authoritative order)
          apiMessages.forEach(apiMsg => {
            mergedMessages.push(apiMsg);
            processedIds.add(apiMsg.id);
          });
          
          // Then, add any real-time messages that aren't in the API response
          current.forEach(rtMsg => {
            if (!processedIds.has(rtMsg.id)) {
              mergedMessages.push(rtMsg);
            }
          });
          
          // Sort by timestamp to ensure proper chronological order
          mergedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          setMessages(conversationId, mergedMessages);
        }

        setNextBefore(data.nextBefore ?? null);
        setHasMore(!!data.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        inflightFor.current = null;
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [conversationId, setMessages]
  );

  // Initial load + whenever the conversation changes
  useEffect(() => {
    if (!conversationId) {
      setNextBefore(null);
      setHasMore(true);
      return;
    }
    fetchMessages();
  }, [conversationId, fetchMessages]);

  const loadOlder = useCallback(() => {
    if (conversationId && hasMore && nextBefore && !isLoadingMore) {
      fetchMessages(nextBefore, true);
    }
  }, [conversationId, hasMore, nextBefore, isLoadingMore, fetchMessages]);

  const refresh = useCallback(() => {
    if (conversationId && !isLoading && !isLoadingMore) {
      fetchMessages();
    }
  }, [conversationId, isLoading, isLoadingMore, fetchMessages]);

  return { messages, isLoading, isLoadingMore, hasMore, loadOlder, refresh, error };
}
