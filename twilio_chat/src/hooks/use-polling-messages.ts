// src/hooks/use-polling-messages.ts
// Fallback polling mechanism when SSE fails
import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Chat, Message } from '@/types';

interface UsePollingMessagesProps {
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  setSelectedChat: (chat: Chat | null) => void;
  selectedChat: Chat | null;
  loggedInAgentId: string;
  enabled?: boolean;
}

export function usePollingMessages({ 
  chats, 
  setChats, 
  setSelectedChat, 
  selectedChat,
  loggedInAgentId,
  enabled = false 
}: UsePollingMessagesProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const lastPollTimeRef = useRef<number>(0);

  // Memoize the current chat IDs to avoid unnecessary re-renders
  const currentChatIds = useMemo(() => new Set(chats.map(chat => chat.id)), [chats]);

  const pollForMessages = useCallback(async () => {
    try {
      const now = Date.now();
      // Throttle polling to max once every 10 seconds for better performance
      if (now - lastPollTimeRef.current < 10000) {
        return;
      }
      lastPollTimeRef.current = now;

      // Use a more efficient endpoint that only fetches recent changes
      const response = await fetch(`/api/twilio/conversations?agentId=${loggedInAgentId}&limit=20&messageLimit=50&since=${lastPollTimeRef.current - 30000}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      
      if (!data.success) {
        console.error('Failed to fetch conversations:', data.error);
        return;
      }
      
      const freshChats = data.conversations;
      
      // Check if there are new messages by comparing message IDs
      let hasNewMessages = false;
      for (const freshChat of freshChats) {
        const currentChat = chats.find(chat => chat.id === freshChat.id);
        if (currentChat) {
          const currentMessageIds = new Set(currentChat.messages.map(msg => msg.id));
          const freshMessageIds = new Set(freshChat.messages.map(msg => msg.id));
          
          // Check if there are new message IDs
          for (const messageId of freshMessageIds) {
            if (!currentMessageIds.has(messageId)) {
              hasNewMessages = true;
              console.log('📨 New message detected:', messageId);
              break;
            }
          }
        } else {
          // New chat
          hasNewMessages = true;
          console.log('💬 New chat detected:', freshChat.id);
        }
      }
      
      if (hasNewMessages) {
        console.log('📨 New messages detected via polling!');
        setChats(freshChats);
        
        // Update selected chat if it exists
        if (selectedChat) {
          const updatedSelectedChat = freshChats.find(chat => chat.id === selectedChat.id);
          if (updatedSelectedChat) {
            console.log('🔄 Updating selected chat with new messages');
            setSelectedChat(updatedSelectedChat);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error polling for messages:', error);
    }
  }, [chats, loggedInAgentId, selectedChat, setChats, setSelectedChat]);

  useEffect(() => {
    if (!enabled) return;

    console.log('🔄 Starting polling for new messages...');
    
        // Poll less frequently to reduce server load
        const pollInterval = process.env.NODE_ENV === 'development' ? 15000 : 30000;
        intervalRef.current = setInterval(pollForMessages, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, pollForMessages]);

  return {
    startPolling: () => {
      if (!intervalRef.current) {
        console.log('🔄 Manual polling started');
        // Start polling immediately
      }
    },
    stopPolling: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('⏹️ Polling stopped');
      }
    }
  };
}
