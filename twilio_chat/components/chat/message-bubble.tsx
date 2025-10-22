'use client';
import { useState, useEffect } from 'react';
import type { Message } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { MediaMessage } from './media-message';
import { MessageStatus } from './message-status';

interface MessageBubbleProps {
  message: Message;
  avatarUrl: string;
  showAvatar: boolean;
  contactName?: string;
  agentName?: string;
}

export function MessageBubble({ message, avatarUrl, showAvatar, contactName, agentName }: MessageBubbleProps) {
  const isAgent = message.sender === 'agent';
  const [formattedTimestamp, setFormattedTimestamp] = useState('');

  // Generate proper initials from contact name or sender ID
  const getInitials = () => {
    // For agent messages, use agent name instead of contact name
    if (isAgent) {
      // Use the passed agentName prop first
      if (agentName && agentName.length >= 2) {
        return agentName.substring(0, 2).toUpperCase();
      }
      
      // Try to get agent name from the store as fallback
      try {
        const { useChatStore } = require('@/store/chat-store');
        const store = useChatStore.getState();
        const me = store.me;
        
        // If this message is from the current logged-in agent, use their name
        if (me && message.senderId === me.id) {
          if (me.name && me.name.length >= 2) {
            return me.name.substring(0, 2).toUpperCase();
          }
        }
      } catch (error) {
        // Fallback if store is not available
      }
      
      // Try to extract agent name from senderId (e.g., "admin_001" -> "AD")
      if (message.senderId) {
        if (message.senderId === 'admin_001') {
          return 'AD'; // Admin
        } else if (message.senderId.startsWith('agent-')) {
          // Extract agent name from agent-xxx format
          const agentName = message.senderId.replace('agent-', '');
          if (agentName.length >= 2) {
            return agentName.substring(0, 2).toUpperCase();
          }
        } else if (message.senderId.startsWith('admin_')) {
          return 'AD'; // Admin
        } else if (message.senderId.includes('agent_')) {
          // Handle agent_xxx format
          return 'AG'; // Agent
        }
      }
      return 'AG'; // Default agent fallback
    }
    
    // For customer messages, use contact name
    if (contactName) {
      // Extract initials from contact name (e.g., "Abdelrahman Baraka" -> "AB")
      const words = contactName.trim().split(' ');
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      } else if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
      }
    }
    
    // Fallback: try to extract from senderId
    if (message.senderId) {
      // If senderId is like "whatsapp:+1234567890", we can't get initials from it
      // So we'll use a generic fallback
      if (message.senderId.startsWith('whatsapp:')) {
        return 'C'; // Customer
      }
      // If it's something like "WH", use the first two characters
      return message.senderId.substring(0, 2).toUpperCase();
    }
    
    return 'C'; // Default fallback
  };

  useEffect(() => {
    // Format timestamp on the client to avoid hydration mismatch
    setFormattedTimestamp(format(new Date(message.timestamp), 'p'));
  }, [message.timestamp]);

  return (
    <div className={cn("flex items-end gap-2", isAgent ? "justify-end" : "justify-start")}>
      {!isAgent && showAvatar && (
        <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt="Avatar" />
            <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
      )}
       {!isAgent && !showAvatar && (
        <div className="w-8" />
      )}
      <div
        className={cn(
          "rounded-lg px-3 py-2 max-w-md relative animate-in fade-in zoom-in-95",
          isAgent ? "bg-primary text-primary-foreground" : "bg-card shadow-sm",
        )}
      >
        {/* Display media using the enhanced MediaMessage component */}
        {message.media?.map((mediaItem, index) => {
          console.log('🖼️ Rendering media item:', { url: mediaItem.url, contentType: mediaItem.contentType, sid: mediaItem.sid });
          
          // Determine media type from content type
          const getMediaType = (contentType: string) => {
            if (contentType?.startsWith('image/')) return 'image';
            if (contentType?.startsWith('video/')) return 'video';
            if (contentType?.startsWith('audio/')) return 'audio';
            return 'document';
          };
          
          return (
            <div key={index} className="mt-2">
              <MediaMessage
                mediaType={getMediaType(mediaItem.contentType || '')}
                mediaUrl={mediaItem.url}
                mediaContentType={mediaItem.contentType || ''}
                fileName={mediaItem.filename}
                caption={message.text || undefined}
                timestamp={message.timestamp}
                sender={message.sender}
              />
            </div>
          );
        })}
        
        {/* Display text content */}
        {message.text && (
          <p className="text-sm break-words">{message.text}</p>
        )}
        
        {/* Show media placeholder if no text and no media displayed */}
        {!message.text && !message.media?.length && (
          <p className="text-sm text-gray-500 italic">Empty message</p>
        )}
        
        
        {/* Timestamp and status row */}
        <div className={`flex items-center justify-end gap-1 mt-1 ${
          isAgent ? "opacity-60" : "text-gray-500"
        }`}>
          <span className="text-xs">
            {formattedTimestamp}
          </span>
          {/* Show delivery status for agent messages */}
          {isAgent && message.deliveryStatus && (
            <div className="ml-2 bg-black/20 rounded-full p-1">
              <MessageStatus 
                status={message.deliveryStatus} 
                className=""
              />
            </div>
          )}
        </div>
      </div>
      {isAgent && !showAvatar && (
        <div className="w-8" />
      )}
      {isAgent && showAvatar && (
        <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt="Avatar" />
            <AvatarFallback>A</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
