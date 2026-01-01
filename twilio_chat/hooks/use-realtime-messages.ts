/**
 * useRealtimeMessages Hook
 * 
 * Manages Server-Sent Events (SSE) connection for real-time message updates.
 * Handles:
 * - SSE connection and reconnection with exponential backoff
 * - Incoming message processing and deduplication
 * - New conversation creation
 * - Delivery status updates
 * - Network status monitoring
 */

import React, { useEffect, useRef } from 'react';
import { Chat, Message } from '@/types';
import { messageBatcher } from '@/store/chat-store';

/**
 * Determines media type from MIME content type
 */
function getMediaTypeFromContentType(contentType: string): 'image' | 'video' | 'audio' | 'document' {
  if (!contentType) return 'document';
  
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  return 'document';
}

/**
 * Returns emoji representation for media type
 */
function getMediaTypeEmoji(mediaType: string): string {
  switch (mediaType) {
    case 'image': return '🖼️';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'document': return '📄';
    default: return '📎';
  }
}

/**
 * Returns human-readable name for media type
 */
function getMediaTypeName(mediaType: string): string {
  switch (mediaType) {
    case 'image': return 'Image';
    case 'video': return 'Video';
    case 'audio': return 'Audio';
    case 'document': return 'Document';
    default: return 'File';
  }
}

/**
 * Data structure for real-time message events from SSE
 */
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

/**
 * Data structure for new conversation events from SSE
 */
interface RealtimeConversationData {
  conversationSid: string;
  friendlyName: string;
  dateCreated: string;
}

/**
 * Props for useRealtimeMessages hook
 */
interface UseRealtimeMessagesProps {
  loggedInAgentId?: string;
}

/**
 * Hook for managing real-time message updates via Server-Sent Events
 * 
 * @param props - Hook configuration
 * @returns void (side effects only)
 */
export function useRealtimeMessages({ loggedInAgentId }: UseRealtimeMessagesProps) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 10;

  /**
   * Establishes SSE connection to /api/events endpoint
   * Implements exponential backoff for reconnection attempts
   * Handles network status and connection errors
   */
  const connectSSE = () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Check if we've exceeded max reconnection attempts
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached, stopping SSE reconnection');
          return;
        }

        reconnectAttemptsRef.current += 1;

        // Check if we're online before attempting connection
        if (!navigator.onLine) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, 5000);
          return;
        }

        // Create new EventSource connection
        let eventSource: EventSource;
        try {
          const eventsUrl = `${window.location.origin}/api/events`;
          eventSource = new EventSource(eventsUrl);
          eventSourceRef.current = eventSource;
        } catch (error) {
          console.error('Failed to create EventSource:', error);
          // Retry after a delay
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, 5000);
          return;
        }

    // Handle successful connection
    eventSource.onopen = () => {
      // Reset reconnection attempts on successful connection
      reconnectAttemptsRef.current = 0;
    };

    // Handle incoming SSE messages
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          // Connection established
        } else if (data.type === 'heartbeat') {
          // Heartbeat received - connection is alive
        } else if (data.type === 'newMessage') {
          // Warn if profileName is missing (important for contact name display)
          if (!data.data.profileName || data.data.profileName.trim() === '') {
            console.warn('SSE Message missing profileName:', {
              conversationSid: data.data.conversationSid,
              messageSid: data.data.messageSid
            });
          }
          
          handleNewMessage(data.data as RealtimeMessageData);
        } else if (data.type === 'newConversation') {
          handleNewConversation(data.data as RealtimeConversationData);
        } else if (data.type === 'deliveryStatusUpdate') {
          handleDeliveryStatusUpdate(data.data);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    // Handle connection errors with exponential backoff retry
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Close the current connection properly
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // Implement exponential backoff for reconnection
      const baseDelay = 1000; // Start with 1 second
      const maxDelay = 30000; // Max 30 seconds
      const backoffMultiplier = 1.5;
      const jitter = Math.random() * 1000; // Add up to 1 second of jitter
      
      const reconnectDelay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, reconnectAttemptsRef.current) + jitter,
        maxDelay
      );
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSSE();
      }, reconnectDelay);
    };

    return eventSource;
  };

  useEffect(() => {
    const eventSource = connectSSE();
    
    // Monitor network status and reconnect when back online
    const handleOnline = () => {
      reconnectAttemptsRef.current = 0; // Reset attempts when back online
      connectSSE();
    };
    
    const handleOffline = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Periodic connection health check (every 10 seconds)
    const healthCheckInterval = setInterval(() => {
      if (eventSourceRef.current) {
        const state = eventSourceRef.current.readyState;
        if (state === EventSource.CLOSED) {
          connectSSE();
        }
      } else {
        connectSSE();
      }
    }, 10000);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(healthCheckInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  /**
   * Handles incoming new message from SSE
   * - Determines message direction (agent vs customer)
   * - Creates/updates contact information if profileName is present
   * - Processes media attachments
   * - Deduplicates messages to prevent duplicates
   * - Adds message to store and updates conversation
   */
  const handleNewMessage = async (messageData: RealtimeMessageData) => {
    // Determine if message is from an agent or customer
    const isAgentMessage = messageData.author && (
      messageData.author.startsWith('agent-') || 
      messageData.author === 'admin_001' ||
      messageData.author.startsWith('admin_') ||
      messageData.author === loggedInAgentId ||
      messageData.author === 'admin'
    );
    
    // Handle new contact information from incoming customer messages
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
          await response.json();
        }
      } catch (error) {
        console.error('Error creating contact in database:', error);
      }
    }
    
    // Process media attachments
    const hasMedia = (messageData.numMedia || 0) > 0 || (messageData.mediaMessages?.length || 0) > 0 || (messageData.media?.length || 0) > 0;
    const mediaMessages = messageData.mediaMessages || [];
    const mediaArray = messageData.media || [];
    
    // Filter out invalid media items (must have url and contentType)
    const validMediaArray = mediaArray.filter((media: any) => 
      media && media.url && media.contentType
    );
    const validMediaMessages = mediaMessages.filter((msg: any) => 
      msg && msg.url && msg.contentType
    );
    
    // Combine valid media from both sources
    const allValidMedia = validMediaArray.length > 0 
      ? validMediaArray 
      : validMediaMessages.map(msg => ({
          url: msg.url,
          contentType: msg.contentType,
          filename: msg.fileName,
          sid: msg.sid
        }));
    
    // Determine text content - use body if available, otherwise use media caption
    let messageText = messageData.body || '';
    // Check if this is a media message (by presence of media indicators)
    if (!messageText && hasMedia) {
      if (allValidMedia.length > 0) {
        // If no text but has valid media, use a descriptive message
        const firstMedia = allValidMedia[0];
        if (firstMedia && firstMedia.contentType) {
          const mediaType = getMediaTypeFromContentType(firstMedia.contentType);
          messageText = `📎 ${getMediaTypeEmoji(mediaType)} ${getMediaTypeName(mediaType)}`;
        } else {
          messageText = '📎 Media message';
        }
      } else {
        // If hasMedia is true but allValidMedia is empty (invalid media), still show generic message
        messageText = '📎 Media message';
      }
    }
    
    // Create message object for store
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
      mediaType: allValidMedia[0] ? getMediaTypeFromContentType(allValidMedia[0].contentType) : undefined,
      mediaUrl: allValidMedia[0]?.url,
      mediaContentType: allValidMedia[0]?.contentType,
      mediaFileName: allValidMedia[0]?.filename || allValidMedia[0]?.fileName,
      mediaCaption: allValidMedia[0]?.caption,
      // New media array format - only include if we have valid media items
      media: allValidMedia.length > 0 ? allValidMedia : undefined,
    };

    // Import store and get conversationSid
    const { useChatStore } = await import('@/store/chat-store');
    const store = useChatStore.getState();
    
    // Validate conversationSid exists - try to find it if missing
    let conversationSid = messageData.conversationSid;
    
    if (!conversationSid && messageData.messageSid) {
      // Try to find conversationSid from the database via API (client-side safe)
      try {
        const response = await fetch(`/api/messages/${messageData.messageSid}/conversation`);
        if (response.ok) {
          const data = await response.json();
          if (data.conversationSid) {
            conversationSid = data.conversationSid;
          }
        }
      } catch (error) {
        console.error('Error looking up conversationSid via API:', error);
      }
    }
    
    if (!conversationSid) {
      console.error('Cannot process message: conversationSid is missing', messageData);
      return;
    }
    
    // Check for duplicate messages to prevent showing the same message twice
    // Uses multiple criteria: Twilio SID, content+timestamp, message ID, or temp message replacement
    const existingMessages = store.messages[conversationSid] || [];
    
    // Check for duplicates using multiple criteria
    let existingMessageIndex = -1;
    const isDuplicate = existingMessages.some((msg, index) => {
      // Check by Twilio message SID first (most reliable)
      if (msg.twilioMessageSid && messageData.messageSid && msg.twilioMessageSid === messageData.messageSid) {
        existingMessageIndex = index;
        return true;
      }
      
      // Check by exact same content, sender, and timestamp (within 2 seconds)
      if (msg.text === newMessage.text && 
          msg.sender === newMessage.sender &&
          Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 2000) {
        existingMessageIndex = index;
        return true;
      }
      
      // Check by message ID if available
      if (msg.id === newMessage.id) {
        existingMessageIndex = index;
        return true;
      }
      
      // Check if this is a real message replacing a temporary message
      if (msg.id.startsWith('temp-') && 
          !newMessage.id.startsWith('temp-') &&
          msg.text === newMessage.text && 
          msg.sender === newMessage.sender &&
          Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 10000) {
        existingMessageIndex = index;
        return true;
      }
      
      return false;
    });
    
    if (isDuplicate) {
      if (existingMessageIndex >= 0) {
        // Replace the existing message with the real message from webhook
        const updatedMessages = [...existingMessages];
        updatedMessages[existingMessageIndex] = newMessage;
        store.setMessages(conversationSid, updatedMessages);
        return;
      } else {
        // Duplicate detected, skip
        return;
      }
    }
    
    // Ensure conversation exists in store before adding message
    // Create placeholder if conversation doesn't exist yet
    const conversationExists = store.conversations.find(c => c.id === conversationSid);
    
    if (!conversationExists) {
      // Determine conversation title - prioritize profileName, then contact mapping, then formatted phone
      let conversationTitle = '';
      
      // First, try to use profileName from message data
      if (messageData.profileName && messageData.profileName.trim() !== '') {
        conversationTitle = messageData.profileName;
      } 
      // Second, try to get from contact mapping (in-memory)
      else if (messageData.from) {
        try {
          const { normalizePhoneNumber } = await import('@/lib/utils');
          const { getContact } = await import('@/lib/contact-mapping');
          const normalizedPhone = normalizePhoneNumber(messageData.from);
          const contact = getContact(normalizedPhone);
          if (contact && contact.name && contact.name.trim() !== '') {
            conversationTitle = contact.name;
          } else {
            // Use formatted phone number (without + prefix)
            conversationTitle = normalizedPhone.replace(/^\+/, '');
          }
        } catch (error) {
          // Fallback to formatted phone
          const normalizedPhone = messageData.from.replace(/^whatsapp:/, '').replace(/^\+/, '');
          conversationTitle = normalizedPhone;
        }
      }
      // Last resort: use conversation SID
      else {
        conversationTitle = conversationSid.length > 8 
          ? `Conversation ${conversationSid.slice(-8)}` 
          : `Conversation ${conversationSid}`;
      }
      
      // Generate proper preview text for media messages
      let previewText = newMessage.text;
      if (!previewText && (newMessage.media?.length || newMessage.mediaUrl || newMessage.mediaContentType)) {
        if (newMessage.media && newMessage.media.length > 0) {
          const firstMedia = newMessage.media[0];
          const mediaType = getMediaTypeFromContentType(firstMedia.contentType || '');
          previewText = `📎 ${getMediaTypeEmoji(mediaType)} ${getMediaTypeName(mediaType)}`;
        } else if (newMessage.mediaContentType) {
          const mediaType = getMediaTypeFromContentType(newMessage.mediaContentType);
          previewText = `📎 ${getMediaTypeEmoji(mediaType)} ${getMediaTypeName(mediaType)}`;
        } else {
          previewText = '📎 Media message';
        }
      }
      
      const placeholderConversation = {
        id: conversationSid,
        title: conversationTitle,
        lastMessagePreview: previewText || '[Message]',
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerId: messageData.author || 'unknown',
        agentId: 'unassigned',
        status: 'open' as const,
        customerPhone: messageData.from ? messageData.from.replace(/^whatsapp:/, '') : undefined
      };
      
      store.setConversations([placeholderConversation, ...store.conversations]);
    }
    
    // Append message to store
    store.appendMessage(conversationSid, newMessage);
    
    // Show notification for incoming customer messages
    if (!isAgentMessage) {
      // Get conversation title for notification
      const conversation = store.conversations.find(conv => conv.id === conversationSid);
      const conversationTitle = conversation?.title || `Customer ${messageData.from?.replace('whatsapp:', '') || 'Unknown'}`;
      
      // Generate proper notification text for media messages
      let notificationText = newMessage.text;
      if (!notificationText && (newMessage.media?.length || newMessage.mediaUrl || newMessage.mediaContentType)) {
        if (newMessage.media && newMessage.media.length > 0) {
          const firstMedia = newMessage.media[0];
          const mediaType = getMediaTypeFromContentType(firstMedia.contentType || '');
          notificationText = `📎 ${getMediaTypeEmoji(mediaType)} ${getMediaTypeName(mediaType)}`;
        } else if (newMessage.mediaContentType) {
          const mediaType = getMediaTypeFromContentType(newMessage.mediaContentType);
          notificationText = `📎 ${getMediaTypeEmoji(mediaType)} ${getMediaTypeName(mediaType)}`;
        } else {
          notificationText = '📎 Media message';
        }
      }
      
      // Show notification
      import('@/lib/notification-service').then(({ notificationService }) => {
        notificationService.showNewMessageNotification(
          conversationTitle,
          notificationText || '[Message]'
        ).catch(error => {
          console.error('Error showing message notification:', error);
        });
      });
    }
  };

  /**
   * Handles new conversation creation event from SSE
   * Fetches full conversation details and adds to store
   */
  const handleNewConversation = async (conversationData: RealtimeConversationData) => {
    if (!loggedInAgentId) {
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
                console.error('Error showing notification:', error);
              });
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching new conversation:', error);
    }
  };

  /**
   * Handles delivery status updates for sent messages
   * Updates message status in store (sent, delivered, read, failed, etc.)
   */
  const handleDeliveryStatusUpdate = async (statusData: {
    conversationSid: string;
    messageSid: string;
    status: 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';
    timestamp: string;
  }) => {
    try {
      // Import store and update message status
      const { useChatStore } = await import('@/store/chat-store');
      const store = useChatStore.getState();
      
      // Find the message by Twilio message SID and update its status
      const messages = store.messages[statusData.conversationSid] || [];
      const messageToUpdate = messages.find(msg => msg.twilioMessageSid === statusData.messageSid);
      
      if (messageToUpdate) {
        store.updateMessageStatus(statusData.conversationSid, messageToUpdate.id, statusData.status);
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };
}


