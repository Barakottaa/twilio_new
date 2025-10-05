'use client';
import { useState, useEffect } from 'react';
import type { Message } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { MediaMessage } from './media-message';

interface MessageBubbleProps {
  message: Message;
  avatarUrl: string;
  showAvatar: boolean;
}

export function MessageBubble({ message, avatarUrl, showAvatar }: MessageBubbleProps) {
  const isAgent = message.sender === 'agent';
  const [formattedTimestamp, setFormattedTimestamp] = useState('');

  useEffect(() => {
    // Format timestamp on the client to avoid hydration mismatch
    setFormattedTimestamp(format(new Date(message.timestamp), 'p'));
  }, [message.timestamp]);

  return (
    <div className={cn("flex items-end gap-2", isAgent ? "justify-end" : "justify-start")}>
      {!isAgent && showAvatar && (
        <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt="Avatar" />
            <AvatarFallback>C</AvatarFallback>
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
        {/* Display media if present (Option 1: Twilio-only storage) */}
        {message.mediaType && message.mediaUrl && (
          <div className="mb-2">
            <MediaMessage
              mediaType={message.mediaType}
              mediaUrl={message.mediaUrl}
              mediaContentType={message.mediaContentType || ''}
              fileName={message.mediaFileName}
              caption={message.mediaCaption}
              timestamp={message.timestamp}
              sender={message.sender}
            />
          </div>
        )}

        {/* Display new media array format */}
        {message.media?.map((mediaItem, index) => {
          console.log('🖼️ Rendering media item:', { url: mediaItem.url, contentType: mediaItem.contentType, sid: mediaItem.sid });
          return (
          <div key={index} className="mt-2">
            {mediaItem.contentType?.startsWith('image/') ? (
              <div className="relative">
                <img 
                  src={mediaItem.url} 
                  alt={mediaItem.filename || 'media'} 
                  className="max-w-xs rounded"
                  width={320}
                  height={240}
                  loading="lazy"
                  style={{ aspectRatio: '4/3' }}
                  onError={(e) => console.error('❌ Image failed to load:', mediaItem.url, e)}
                  onLoad={() => console.log('✅ Image loaded successfully:', mediaItem.url)}
                />
              </div>
            ) : (
              <a 
                href={mediaItem.url} 
                target="_blank" 
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {mediaItem.filename || mediaItem.contentType || 'Download file'}
              </a>
            )}
          </div>
        );
        })}
        
        {/* Display text content */}
        {message.text && (
          <p className="text-sm break-words">{message.text}</p>
        )}
        
        {/* Show media placeholder if no text and no media displayed */}
        {!message.text && !message.mediaType && !message.mediaUrl && !message.media?.length && (
          <p className="text-sm text-gray-500 italic">Empty message</p>
        )}
        
        
        <span className={`text-xs text-right block mt-1 ${
          isAgent ? "opacity-60" : "text-gray-500"
        }`}>
          {formattedTimestamp}
        </span>
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
