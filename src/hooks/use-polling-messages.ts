// src/hooks/use-polling-messages.ts
// Fallback polling mechanism when SSE fails
import { useEffect, useRef } from 'react';
import { Chat, Message } from '@/types';
import { getTwilioConversations } from '@/lib/twilio-service';

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

  useEffect(() => {
    if (!enabled) return;

    console.log('🔄 Starting polling for new messages...');
    
    const pollForMessages = async () => {
      try {
        const freshChats = await getTwilioConversations(loggedInAgentId);
        
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
    };

    // Poll every 5 seconds
    intervalRef.current = setInterval(pollForMessages, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, loggedInAgentId, chats, selectedChat, setChats, setSelectedChat]);

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
