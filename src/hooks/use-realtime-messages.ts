// src/hooks/use-realtime-messages.ts
import React, { useEffect, useRef } from 'react';
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
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  setSelectedChat: (chat: Chat | null) => void;
  loggedInAgentId?: string;
}

export function useRealtimeMessages({ chats, setChats, setSelectedChat, loggedInAgentId }: UseRealtimeMessagesProps) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log('🔌 Connecting to SSE...');
    const eventSource = new EventSource('/api/events');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('✅ SSE connection opened');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          console.log('📡 SSE connected:', data.message);
        } else if (data.type === 'heartbeat') {
          console.log('💓 SSE heartbeat received');
        } else if (data.type === 'newMessage') {
          console.log('📨 New message via SSE:', data.data);
          handleNewMessage(data.data as RealtimeMessageData);
        } else if (data.type === 'newConversation') {
          console.log('💬 New conversation via SSE:', data.data);
          handleNewConversation(data.data as RealtimeConversationData);
        }
      } catch (error) {
        console.error('❌ Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Attempting to reconnect SSE...');
        connectSSE();
      }, 5000);
    };

    return eventSource;
  };

  useEffect(() => {
    const eventSource = connectSSE();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      eventSource.close();
    };
  }, []);

  const handleNewMessage = (messageData: RealtimeMessageData) => {
    // Fix message direction logic to match the main service
    const isAgentMessage = messageData.author && (
      messageData.author.startsWith('agent-') || 
      messageData.author === 'admin_001' ||
      messageData.author.startsWith('admin_')
    );
    
    const newMessage: Message = {
      id: messageData.messageSid,
      text: messageData.body,
      timestamp: messageData.dateCreated,
      sender: isAgentMessage ? 'agent' : 'customer',
      senderId: messageData.author || 'customer',
    };

    setChats((prevChats: Chat[]) => {
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

  const handleNewConversation = async (conversationData: RealtimeConversationData) => {
    console.log('💬 New conversation created:', conversationData);
    
    if (!loggedInAgentId) {
      console.log('⚠️ No logged in agent ID, skipping conversation fetch');
      return;
    }

    try {
      // Fetch the full conversation details from the API
      const response = await fetch(`/api/twilio/conversations?agentId=${loggedInAgentId}&limit=1&conversationId=${conversationData.conversationSid}`);
      const data = await response.json();
      
      if (data.success && data.conversations && data.conversations.length > 0) {
        const newConversation = data.conversations[0];
        
        // Check if conversation already exists to avoid duplicates
        const conversationExists = chats.some(chat => chat.id === newConversation.id);
        
        if (!conversationExists) {
          console.log('✅ Adding new conversation to UI:', newConversation.id);
          
          // Add the new conversation to the beginning of the chats list
          setChats(prevChats => [newConversation, ...prevChats]);
          
          // Optionally auto-select the new conversation
          setSelectedChat(newConversation);
        } else {
          console.log('ℹ️ Conversation already exists in UI:', newConversation.id);
        }
      } else {
        console.log('⚠️ Failed to fetch new conversation details:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching new conversation:', error);
    }
  };
}

