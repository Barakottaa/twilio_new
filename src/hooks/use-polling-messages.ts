// src/hooks/use-polling-messages.ts
// Fallback polling mechanism when SSE fails
import { useEffect, useRef } from 'react';
import { Chat, Message } from '@/types';
import { getTwilioConversations } from '@/lib/twilio-service';

interface UsePollingMessagesProps {
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  setSelectedChat: (chat: Chat | null) => void;
  loggedInAgentId: string;
  enabled?: boolean;
}

export function usePollingMessages({ 
  chats, 
  setChats, 
  setSelectedChat, 
  loggedInAgentId,
  enabled = false 
}: UsePollingMessagesProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    console.log('🔄 Starting polling for new messages...');
    
    const pollForMessages = async () => {
      try {
        const freshChats = await getTwilioConversations(loggedInAgentId);
        
        // Check if there are new messages
        const totalMessages = freshChats.reduce((sum, chat) => sum + chat.messages.length, 0);
        
        if (totalMessages > lastMessageCountRef.current) {
          console.log('📨 New messages detected via polling!');
          setChats(freshChats);
          
          // Update selected chat if it exists
          const currentSelectedChat = chats.find(chat => chat.id === setSelectedChat);
          if (currentSelectedChat) {
            const updatedSelectedChat = freshChats.find(chat => chat.id === currentSelectedChat.id);
            if (updatedSelectedChat) {
              setSelectedChat(updatedSelectedChat);
            }
          }
        }
        
        lastMessageCountRef.current = totalMessages;
      } catch (error) {
        console.error('❌ Error polling for messages:', error);
      }
    };

    // Poll every 5 seconds
    intervalRef.current = setInterval(pollForMessages, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, loggedInAgentId, chats, setChats, setSelectedChat]);

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
