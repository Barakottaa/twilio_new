// src/hooks/use-realtime-messages.ts
import React, { useEffect, useRef } from 'react';
import { Chat, Message } from '@/types';
import { messageBatcher } from '@/store/chat-store';

interface RealtimeMessageData {
  conversationSid: string;
  messageSid: string;
  body: string;
  author: string;
  dateCreated: string;
  index: string;
  numMedia?: number;
  mediaMessages?: Array<{
    type: string;
    url: string;
    contentType: string;
    fileName: string;
    caption?: string;
  }>;
  // New media array format
  media?: Array<{
    url: string;
    contentType: string;
    filename?: string;
  }>;
  profileName?: string;
  waId?: string;
  from?: string;
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
        
        // Add a small delay to ensure connection is established
        setTimeout(() => {
          if (eventSource.readyState === EventSource.OPEN) {
            console.log('✅ SSE connection confirmed as open');
          } else {
            console.log('⚠️ SSE connection not open, readyState:', eventSource.readyState);
          }
        }, 100);

    eventSource.onopen = () => {
      console.log('✅ SSE connection opened');
      console.log('🔗 SSE URL:', eventSource.url);
      console.log('🔗 SSE readyState:', eventSource.readyState);
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
          console.log('📨 Message details:', {
            conversationSid: data.data.conversationSid,
            messageSid: data.data.messageSid,
            body: data.data.body,
            author: data.data.author,
            profileName: data.data.profileName,
            from: data.data.from,
            numMedia: data.data.numMedia,
            mediaMessages: data.data.mediaMessages
          });
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
          console.log('🔍 SSE readyState on error:', eventSource.readyState);
          
          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          // Attempt to reconnect more aggressively in development
          const reconnectDelay = process.env.NODE_ENV === 'development' ? 1000 : 5000;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Attempting to reconnect SSE after ${reconnectDelay}ms...`);
            connectSSE();
          }, reconnectDelay);
        };

    return eventSource;
  };

  useEffect(() => {
    const eventSource = connectSSE();
    
    // Add periodic connection health check
    const healthCheckInterval = setInterval(() => {
      if (eventSourceRef.current) {
        if (eventSourceRef.current.readyState === EventSource.CLOSED) {
          console.log('🔍 SSE connection is closed, attempting to reconnect...');
          connectSSE();
        } else if (eventSourceRef.current.readyState === EventSource.CONNECTING) {
          console.log('🔍 SSE connection is still connecting...');
        } else {
          console.log('✅ SSE connection is healthy');
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(healthCheckInterval);
      eventSource.close();
    };
  }, []);

  const handleNewMessage = (messageData: RealtimeMessageData) => {
    console.log('🔄 Processing new message:', messageData);
    
    // Fix message direction logic to match the main service
    const isAgentMessage = messageData.author && (
      messageData.author.startsWith('agent-') || 
      messageData.author === 'admin_001' ||
      messageData.author.startsWith('admin_')
    );
    
    console.log('🔍 Message direction check:', {
      author: messageData.author,
      isAgentMessage,
      senderType: isAgentMessage ? 'agent' : 'customer'
    });
    
    // Handle new contact information
    if (messageData.profileName && messageData.from && !isAgentMessage) {
      console.log('👤 New contact detected:', {
        profileName: messageData.profileName,
        from: messageData.from,
        waId: messageData.waId
      });
      
      // Add contact to in-memory mapping
      const phoneNumber = messageData.from.replace('whatsapp:', '');
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(messageData.profileName)}&background=random`;
      
      // Import and use addContact function
      import('@/lib/contact-mapping').then(({ addContact }) => {
        addContact(phoneNumber, messageData.profileName, avatar);
        console.log('✅ New contact added to memory mapping');
      });
    }
    
    const newMessage: Message = {
      id: messageData.messageSid,
      text: messageData.body || (messageData.mediaMessages?.[0]?.caption || ''),
      timestamp: messageData.dateCreated,
      sender: isAgentMessage ? 'agent' : 'customer',
      senderId: messageData.author || 'customer',
      // Legacy media fields for backward compatibility
      mediaType: messageData.mediaMessages?.[0]?.type,
      mediaUrl: messageData.mediaMessages?.[0]?.url,
      mediaContentType: messageData.mediaMessages?.[0]?.contentType,
      mediaFileName: messageData.mediaMessages?.[0]?.fileName,
      mediaCaption: messageData.mediaMessages?.[0]?.caption,
      // New media array format
      media: messageData.media || (messageData.mediaMessages?.map(msg => ({
        url: msg.url,
        contentType: msg.contentType,
        filename: msg.fileName
      }))),
    };
    
    console.log('📝 Created new message object:', newMessage);
    console.log('📝 Message text content:', newMessage.text);
    console.log('📝 Message media info:', {
      mediaType: newMessage.mediaType,
      mediaUrl: newMessage.mediaUrl,
      mediaContentType: newMessage.mediaContentType,
      mediaFileName: newMessage.mediaFileName,
      mediaCaption: newMessage.mediaCaption
    });

    // Use batched updates for better performance
    messageBatcher.enqueue(messageData.conversationSid, newMessage);
    
    console.log('📝 Message queued for batched update:', newMessage.id);
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

