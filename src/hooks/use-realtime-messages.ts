// src/hooks/use-realtime-messages.ts
import { useEffect, useRef } from 'react';
import { Chat, Message } from '@/types';

interface RealtimeMessageData {
  conversationSid: string;
  messageSid: string;
  body: string;
  author: string;
  dateCreated: string;
  index: string;
}

interface RealtimeConversationData {
  conversationSid: string;
  friendlyName: string;
  dateCreated: string;
}

interface UseRealtimeMessagesProps {
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  setSelectedChat: (chat: Chat | null) => void;
}

export function useRealtimeMessages({ chats, setChats, setSelectedChat }: UseRealtimeMessagesProps) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Create SSE connection
    const eventSource = new EventSource('/api/events');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'newMessage') {
          handleNewMessage(data.data as RealtimeMessageData);
        } else if (data.type === 'newConversation') {
          handleNewConversation(data.data as RealtimeConversationData);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          eventSourceRef.current = new EventSource('/api/events');
        }
      }, 3000);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleNewMessage = (messageData: RealtimeMessageData) => {
    const newMessage: Message = {
      id: messageData.messageSid,
      text: messageData.body,
      timestamp: messageData.dateCreated,
      sender: messageData.author.startsWith('agent-') ? 'agent' : 'customer',
      senderId: messageData.author,
    };

    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat.id === messageData.conversationSid) {
          // Check if message already exists to avoid duplicates
          const messageExists = chat.messages.some(msg => msg.id === newMessage.id);
          if (!messageExists) {
            return {
              ...chat,
              messages: [...chat.messages, newMessage],
            };
          }
        }
        return chat;
      });

      // Update selected chat if it's the one receiving the message
      const updatedChat = updatedChats.find(chat => chat.id === messageData.conversationSid);
      if (updatedChat) {
        setSelectedChat(updatedChat);
      }

      return updatedChats;
    });
  };

  const handleNewConversation = (conversationData: RealtimeConversationData) => {
    // For new conversations, we might need to fetch the full conversation details
    // For now, we'll just log it and let the user refresh to see new conversations
    console.log('New conversation created:', conversationData);
    
    // You could implement a more sophisticated approach here to fetch
    // the full conversation details and add it to the chats list
  };
}

