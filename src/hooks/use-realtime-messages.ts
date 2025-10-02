// src/hooks/use-realtime-messages.ts
import React, { useEffect, useRef } from 'react';
import { Chat, Message } from '@/types';
import { messageBatcher } from '@/store/chat-store';

// Helper functions for media type detection
function getMediaTypeFromContentType(contentType: string): 'image' | 'video' | 'audio' | 'document' {
  if (!contentType) return 'document';
  
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  return 'document';
}

function getMediaTypeEmoji(mediaType: string): string {
  switch (mediaType) {
    case 'image': return '🖼️';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'document': return '📄';
    default: return '📎';
  }
}

function getMediaTypeName(mediaType: string): string {
  switch (mediaType) {
    case 'image': return 'Image';
    case 'video': return 'Video';
    case 'audio': return 'Audio';
    case 'document': return 'Document';
    default: return 'File';
  }
}

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
  loggedInAgentId?: string;
}

export function useRealtimeMessages({ loggedInAgentId }: UseRealtimeMessagesProps) {
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
            mediaMessages: data.data.mediaMessages,
            media: data.data.media
          });
          console.log('📨 Calling handleNewMessage...');
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

  const handleNewMessage = async (messageData: RealtimeMessageData) => {
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
      
      // Also create contact in database
      try {
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: messageData.profileName,
            phoneNumber: phoneNumber
          }),
        });
        
        if (response.ok) {
          const contact = await response.json();
          console.log('✅ New contact created in database:', contact.id);
        } else {
          console.log('⚠️ Failed to create contact in database:', response.status);
        }
      } catch (error) {
        console.error('❌ Error creating contact in database:', error);
      }
    }
    
    // Process media data properly
    const hasMedia = messageData.numMedia > 0 || messageData.mediaMessages?.length > 0 || messageData.media?.length > 0;
    const mediaMessages = messageData.mediaMessages || [];
    const mediaArray = messageData.media || [];
    
    console.log('🔍 Media detection debug:', {
      numMedia: messageData.numMedia,
      mediaMessages: mediaMessages,
      mediaArray: mediaArray,
      hasMedia: hasMedia,
      body: messageData.body
    });
    
    // Determine text content - use body if available, otherwise use media caption
    let messageText = messageData.body || '';
    if (!messageText && hasMedia) {
      // If no text but has media, use a descriptive message
      const firstMedia = mediaMessages[0] || mediaArray[0];
      if (firstMedia) {
        const mediaType = firstMedia.mediaType || getMediaTypeFromContentType(firstMedia.contentType);
        messageText = `📎 ${getMediaTypeEmoji(mediaType)} ${getMediaTypeName(mediaType)}`;
        console.log('🔍 Generated media text:', messageText);
      }
    }
    
    const newMessage: Message = {
      id: messageData.messageSid,
      text: messageText,
      timestamp: messageData.dateCreated,
      sender: isAgentMessage ? 'agent' : 'customer',
      senderId: messageData.author || 'customer',
      // Legacy media fields for backward compatibility
      mediaType: mediaMessages[0]?.mediaType || getMediaTypeFromContentType(mediaMessages[0]?.mediaContentType),
      mediaUrl: mediaMessages[0]?.mediaUrl,
      mediaContentType: mediaMessages[0]?.mediaContentType,
      mediaFileName: mediaMessages[0]?.mediaFileName,
      mediaCaption: mediaMessages[0]?.mediaCaption,
      // New media array format
      media: mediaArray.length > 0 ? mediaArray : mediaMessages.map(msg => ({
        url: msg.mediaUrl,
        contentType: msg.mediaContentType,
        filename: msg.mediaFileName
      })),
    };
    
    console.log('📝 Created new message object:', newMessage);
    console.log('📝 Message text content:', newMessage.text);
    console.log('📝 Message media info:', {
      hasMedia,
      mediaMessages: mediaMessages,
      mediaArray: mediaArray,
      mediaType: newMessage.mediaType,
      mediaUrl: newMessage.mediaUrl,
      mediaContentType: newMessage.mediaContentType,
      mediaFileName: newMessage.mediaFileName,
      mediaCaption: newMessage.mediaCaption,
      media: newMessage.media
    });

    // Use the new store system for message updates
    import('@/store/chat-store').then(({ useChatStore }) => {
      const store = useChatStore.getState();
      console.log('🔍 Before appendMessage - Store state:', {
        selectedConversationId: store.selectedConversationId,
        conversationSid: messageData.conversationSid,
        currentMessages: store.messages[messageData.conversationSid]?.length || 0
      });
      
      store.appendMessage(messageData.conversationSid, newMessage);
      
      console.log('🔍 After appendMessage - Store state:', {
        selectedConversationId: store.selectedConversationId,
        conversationSid: messageData.conversationSid,
        currentMessages: store.messages[messageData.conversationSid]?.length || 0
      });
      
      console.log('📝 Message added to store:', newMessage.id);
    });
  };

  const handleNewConversation = async (conversationData: RealtimeConversationData) => {
    console.log('💬 New conversation created:', conversationData);
    
    if (!loggedInAgentId) {
      console.log('⚠️ No logged in agent ID, skipping conversation fetch');
      return;
    }

    try {
      // Fetch the full conversation details from the API using the lite endpoint
      const response = await fetch(`/api/twilio/conversations?lite=1&limit=1&conversationId=${conversationData.conversationSid}`);
      const data = await response.json();
      
      if (data.success && data.items && data.items.length > 0) {
        const newConversation = data.items[0];
        
        // Add the new conversation to the store
        import('@/store/chat-store').then(({ useChatStore }) => {
          const store = useChatStore.getState();
          const currentConversations = store.conversations;
          
          // Check if conversation already exists to avoid duplicates
          const conversationExists = currentConversations.some(conv => conv.id === newConversation.id);
          
          if (!conversationExists) {
            console.log('✅ Adding new conversation to store:', newConversation.id);
            const updatedConversations = [newConversation, ...currentConversations];
            store.setConversations(updatedConversations);
            console.log('✅ New conversation added to store');
          } else {
            console.log('ℹ️ Conversation already exists in store:', newConversation.id);
          }
        });
      } else {
        console.log('⚠️ Failed to fetch new conversation details:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching new conversation:', error);
    }
  };
}

