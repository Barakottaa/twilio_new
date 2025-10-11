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
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 10;

      const connectSSE = () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Check if we've exceeded max reconnection attempts
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached, stopping SSE reconnection');
          return;
        }

        reconnectAttemptsRef.current += 1;
        console.log(`🔄 SSE connection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);

        // Connecting to SSE...
        console.log('🔌 Creating new EventSource connection to /api/events');
        const eventSource = new EventSource('/api/events');
        eventSourceRef.current = eventSource;
        
        // Add immediate state check
        console.log('🔍 EventSource created, initial state:', eventSource.readyState);
        
        // Add a small delay to ensure connection is established
        setTimeout(() => {
          if (eventSource.readyState === EventSource.OPEN) {
            console.log('✅ SSE connection confirmed as OPEN after 100ms');
          } else if (eventSource.readyState === EventSource.CONNECTING) {
            console.log('⏳ SSE connection still CONNECTING after 100ms');
          } else {
            console.log('❌ SSE connection CLOSED after 100ms');
          }
        }, 100);

    eventSource.onopen = () => {
      console.log('✅ SSE connection opened successfully');
      console.log('🔍 Connection details:', {
        url: eventSource.url,
        readyState: eventSource.readyState,
        withCredentials: eventSource.withCredentials
      });
      // Reset reconnection attempts on successful connection
      reconnectAttemptsRef.current = 0;
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
          
          // Check current conversation selection
          import('@/store/chat-store').then(({ useChatStore }) => {
            const store = useChatStore.getState();
            console.log('📨 Current selected conversation:', store.selectedConversationId);
            console.log('📨 Message conversation:', data.data.conversationSid);
            console.log('📨 Is message for current conversation?', store.selectedConversationId === data.data.conversationSid);
          });
          
          console.log('📨 Calling handleNewMessage...');
          handleNewMessage(data.data as RealtimeMessageData);
        } else if (data.type === 'newConversation') {
          console.log('💬 New conversation via SSE:', data.data);
          handleNewConversation(data.data as RealtimeConversationData);
        } else if (data.type === 'deliveryStatusUpdate') {
          console.log('📬 Delivery status update via SSE:', data.data);
          handleDeliveryStatusUpdate(data.data);
        }
      } catch (error) {
        console.error('❌ Error parsing SSE message:', error);
      }
    };

        eventSource.onerror = (error) => {
          console.error('❌ SSE connection error:', error);
          console.log('🔍 SSE readyState on error:', eventSource.readyState);
          console.log('🔍 SSE URL:', eventSource.url);
          console.log('🔍 EventSource states:', {
            CONNECTING: EventSource.CONNECTING,
            OPEN: EventSource.OPEN,
            CLOSED: EventSource.CLOSED,
            currentState: eventSource.readyState
          });
          
          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          // Close the current connection properly
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          
          // Only reconnect if we're not already in a reconnection loop
          if (eventSource.readyState === EventSource.CLOSED) {
            const reconnectDelay = process.env.NODE_ENV === 'development' ? 2000 : 5000;
            console.log(`🔄 Connection closed, attempting to reconnect after ${reconnectDelay}ms...`);
            reconnectTimeoutRef.current = setTimeout(() => {
              connectSSE();
            }, reconnectDelay);
          } else {
            console.log('🔍 Connection not fully closed, waiting before reconnect...');
            const reconnectDelay = 5000;
            reconnectTimeoutRef.current = setTimeout(() => {
              connectSSE();
            }, reconnectDelay);
          }
        };

    return eventSource;
  };

  useEffect(() => {
    const eventSource = connectSSE();
    
    // Add periodic connection health check
    const healthCheckInterval = setInterval(() => {
      if (eventSourceRef.current) {
        const state = eventSourceRef.current.readyState;
        if (state === EventSource.CLOSED) {
          console.log('🔍 SSE connection is closed, attempting to reconnect...');
          connectSSE();
        } else if (state === EventSource.CONNECTING) {
          // Limit noisy logs by only reporting CONNECTING state every minute
          const now = Date.now();
          const lastLog = (eventSourceRef.current as any)._lastConnectingLog ?? 0;
          if (now - lastLog > 60000) {
            console.log('🔍 SSE connection is still connecting...');
            (eventSourceRef.current as any)._lastConnectingLog = now;
          }
        } else if (state === EventSource.OPEN) {
          console.log('✅ SSE connection is healthy');
        }
      } else {
        console.log('🔍 No SSE connection found, attempting to connect...');
        connectSSE();
      }
    }, 5000); // Check every 5 seconds (more frequent)
    
    // Add connection status logging
    const statusInterval = setInterval(() => {
      if (eventSourceRef.current) {
        const states = ['CONNECTING', 'OPEN', 'CLOSED'];
        console.log(`📊 SSE Status: ${states[eventSourceRef.current.readyState]} (${eventSourceRef.current.readyState})`);
      }
    }, 30000); // Log status every 30 seconds

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(healthCheckInterval);
      clearInterval(statusInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const handleNewMessage = async (messageData: RealtimeMessageData) => {
    console.log('🔥 handleNewMessage CALLED with:', messageData);
    console.log('🔥 Current conversation:', messageData.conversationSid);
    console.log('🔥 Author:', messageData.author);
    console.log('🔥 Logged in agent ID:', loggedInAgentId);
    
    // Fix message direction logic to match the main service
    const isAgentMessage = messageData.author && (
      messageData.author.startsWith('agent-') || 
      messageData.author === 'admin_001' ||
      messageData.author.startsWith('admin_') ||
      messageData.author === loggedInAgentId ||
      messageData.author === 'admin'
    );
    
    console.log('🔥 Is agent message:', isAgentMessage);
    // Message direction check
    
    // Handle new contact information
    if (messageData.profileName && messageData.from && !isAgentMessage) {
      
      // Add contact to in-memory mapping
      const { normalizePhoneNumber } = await import('@/lib/utils');
      const phoneNumber = normalizePhoneNumber(messageData.from);
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(messageData.profileName)}&background=random`;
      
      // Import and use addContact function
      import('@/lib/contact-mapping').then(({ addContact }) => {
        addContact(phoneNumber, messageData.profileName || 'Unknown', avatar);
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
    const hasMedia = (messageData.numMedia || 0) > 0 || (messageData.mediaMessages?.length || 0) > 0 || (messageData.media?.length || 0) > 0;
    const mediaMessages = messageData.mediaMessages || [];
    const mediaArray = messageData.media || [];
    
    // Media detection debug
    
    // Determine text content - use body if available, otherwise use media caption
    let messageText = messageData.body || '';
    if (!messageText && hasMedia) {
      // If no text but has media, use a descriptive message
      const firstMedia = mediaMessages[0] || mediaArray[0];
      if (firstMedia) {
        const mediaType = getMediaTypeFromContentType(firstMedia.contentType);
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
      // Delivery status for agent messages
      deliveryStatus: isAgentMessage ? 'sent' : undefined,
      twilioMessageSid: messageData.messageSid,
      // Legacy media fields for backward compatibility
      mediaType: mediaMessages[0] ? getMediaTypeFromContentType(mediaMessages[0].contentType) : undefined,
      mediaUrl: mediaMessages[0]?.url,
      mediaContentType: mediaMessages[0]?.contentType,
      mediaFileName: mediaMessages[0]?.fileName,
      mediaCaption: mediaMessages[0]?.caption,
      // New media array format
      media: mediaArray.length > 0 ? mediaArray : mediaMessages.map(msg => ({
        url: msg.url,
        contentType: msg.contentType,
        filename: msg.fileName
      })),
    };
    
    // Created new message object

    // Import store and append message
    const { useChatStore } = await import('@/store/chat-store');
    const store = useChatStore.getState();
    
    // Check for duplicate messages to prevent showing the same message twice
    const existingMessages = store.messages[messageData.conversationSid] || [];
    
    // Check for duplicates using multiple criteria
    const isDuplicate = existingMessages.some(msg => {
      // Check by Twilio message SID first (most reliable)
      if (msg.twilioMessageSid && messageData.messageSid && msg.twilioMessageSid === messageData.messageSid) {
        return true;
      }
      
      // Check by exact same content, sender, and timestamp (within 2 seconds)
      if (msg.text === newMessage.text && 
          msg.sender === newMessage.sender &&
          Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 2000) {
        return true;
      }
      
      // Check by message ID if available
      if (msg.id === newMessage.id) {
        return true;
      }
      
      return false;
    });
    
    if (isDuplicate) {
      console.log('🔄 Duplicate message detected, skipping:', {
        text: newMessage.text,
        twilioSid: messageData.messageSid,
        messageId: newMessage.id
      });
      return;
    }
    
    // Ensure conversation exists in store before adding message
    const conversationExists = store.conversations.find(c => c.id === messageData.conversationSid);
    
    if (!conversationExists) {
      // Create a placeholder conversation for the message
      const placeholderConversation = {
        id: messageData.conversationSid,
        title: `Conversation ${messageData.conversationSid.slice(-8)}`,
        lastMessagePreview: newMessage.text || '[Media]',
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerId: messageData.author || 'unknown',
        agentId: 'unassigned',
        status: 'open' as const
      };
      
      store.setConversations([placeholderConversation, ...store.conversations]);
    }
    
    // Append message using Twilio ConversationSid as the key
    console.log('🔥 About to append message to store:', {
      conversationSid: messageData.conversationSid,
      messageText: newMessage.text,
      messageId: newMessage.id,
      sender: newMessage.sender
    });
    
    store.appendMessage(messageData.conversationSid, newMessage);
    
    console.log('🔥 Message appended to store successfully');
    
    // Verify the message was added
    const updatedMessages = store.messages[messageData.conversationSid] || [];
    console.log('🔥 Messages in store after append:', updatedMessages.length);
    console.log('🔥 Last message in store:', updatedMessages[updatedMessages.length - 1]);
    
    // Show notification for incoming customer messages
    if (!isAgentMessage) {
      console.log('🔔 Showing notification for incoming customer message');
      
      // Get conversation title for notification
      const conversation = store.conversations.find(conv => conv.id === messageData.conversationSid);
      const conversationTitle = conversation?.title || `Customer ${messageData.from?.replace('whatsapp:', '') || 'Unknown'}`;
      
      // Show notification
      import('@/lib/notification-service').then(({ notificationService }) => {
        notificationService.showNewMessageNotification(
          conversationTitle,
          newMessage.text || '[Media]'
        ).catch(error => {
          console.error('❌ Error showing message notification:', error);
        });
      });
    }
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
            
            // Mark conversation as new
            const newConversationWithFlag = { ...newConversation, isNew: true };
            const updatedConversations = [newConversationWithFlag, ...currentConversations];
            store.setConversations(updatedConversations);
            
            // Show notification for new conversation
            import('@/lib/notification-service').then(({ notificationService }) => {
              notificationService.showNewConversationNotification(
                newConversation.title,
                newConversation.customerPhone
              ).catch(error => {
                console.error('❌ Error showing notification:', error);
              });
            });
            
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

  const handleDeliveryStatusUpdate = async (statusData: {
    conversationSid: string;
    messageSid: string;
    status: 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';
    timestamp: string;
  }) => {
    console.log('📬 Processing delivery status update:', statusData);
    
    try {
      // Import store and update message status
      const { useChatStore } = await import('@/store/chat-store');
      const store = useChatStore.getState();
      
      // Find the message by Twilio message SID and update its status
      const messages = store.messages[statusData.conversationSid] || [];
      const messageToUpdate = messages.find(msg => msg.twilioMessageSid === statusData.messageSid);
      
      if (messageToUpdate) {
        console.log('📬 Updating message delivery status:', {
          messageId: messageToUpdate.id,
          twilioMessageSid: statusData.messageSid,
          newStatus: statusData.status
        });
        
        store.updateMessageStatus(statusData.conversationSid, messageToUpdate.id, statusData.status);
        console.log('✅ Message delivery status updated successfully');
      } else {
        console.log('⚠️ Message not found for delivery status update:', statusData.messageSid);
      }
    } catch (error) {
      console.error('❌ Error updating delivery status:', error);
    }
  };
}


