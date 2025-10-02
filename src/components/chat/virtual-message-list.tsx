'use client';

import React, { useEffect, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Message } from '@/types';
import { MessageBubble } from './message-bubble';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface VirtualMessageListProps {
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadOlder: () => void;
  className?: string;
}

export function VirtualMessageList({
  messages,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadOlder,
  className = ''
}: VirtualMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = React.useState(false);
  
  // Function to scroll to bottom with retry mechanism
  const scrollToBottom = () => {
    const container = containerRef.current;
    if (container) {
      const maxScrollHeight = container.scrollHeight;
      container.scrollTop = maxScrollHeight;
      
      // If scroll didn't work, try again after a short delay
      setTimeout(() => {
        if (container.scrollTop < maxScrollHeight - 10) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    }
  };
  
  console.log('🔍 VirtualMessageList render:', { messagesCount: messages.length, isLoading, firstMessage: messages[0] });
  console.log('🔍 VirtualMessageList - all messages:', messages);
  
  // Auto-scroll to bottom when messages change or conversation is first loaded (latest messages are at bottom)
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMore) {
      // Use multiple timeouts to ensure DOM is fully updated
      setTimeout(() => {
        scrollToBottom();
      }, 50);
      setTimeout(() => {
        scrollToBottom();
      }, 200);
    }
  }, [messages.length, isLoadingMore]);

  // Auto-scroll to bottom when new messages arrive (latest messages are at bottom)
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMore && shouldScrollToBottom) {
      scrollToBottom();
      setShouldScrollToBottom(false);
    }
  }, [messages.length, isLoadingMore, shouldScrollToBottom]);

  // Detect when new messages are added (not when loading older ones)
  useEffect(() => {
    if (messages.length > 0 && !isLoadingMore) {
      setShouldScrollToBottom(true);
    }
  }, [messages.length, isLoadingMore]);

  // Handle scroll to detect when user reaches top to load older messages
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const isAtTop = container.scrollTop === 0;
    
    if (isAtTop && hasMore && !isLoadingMore) {
      onLoadOlder();
    }
  };
  
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 ${className}`}>
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div 
        ref={containerRef}
        className="flex flex-col h-full max-h-[600px] overflow-y-auto scrollbar-fixed"
        onScroll={handleScroll}
      >
        {/* Load more indicator at the top */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        )}
        
        {/* Messages - Latest messages at bottom, scroll up for latest */}
        {messages.map((message, index) => (
          <div key={message.id} className="px-4 py-2">
            <MessageBubble 
              message={message} 
              avatarUrl={`https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderId)}&background=random`}
              showAvatar={true}
            />
          </div>
        ))}
        
        {/* Scroll to top indicator */}
        {hasMore && !isLoadingMore && (
          <div className="flex justify-center py-2">
            <div className="text-xs text-muted-foreground">
              Scroll up to load older messages
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
