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
  contactName?: string;
  agentName?: string;
  conversationId?: string; // Add conversationId to detect conversation changes
}

export function VirtualMessageList({
  messages,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadOlder,
  className = '',
  contactName,
  agentName,
  conversationId
}: VirtualMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previousConversationId, setPreviousConversationId] = React.useState<string | undefined>(undefined);
  const [userHasScrolled, setUserHasScrolled] = React.useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper function to scroll to bottom
  const scrollToBottom = React.useCallback(() => {
    const container = containerRef.current;
    if (container) {
      console.log('🔄 Executing scroll to bottom');
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);
  
  // Auto-scroll to bottom when conversation changes (new conversation selected)
  useEffect(() => {
    if (conversationId && conversationId !== previousConversationId) {
      console.log('🔄 Conversation changed, scrolling to bottom:', { 
        previousConversationId, 
        newConversationId: conversationId 
      });
      setPreviousConversationId(conversationId);
      setUserHasScrolled(false); // Reset scroll state for new conversation
      
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Try multiple times to ensure scroll happens
      scrollToBottom(); // Immediate
      
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToBottom(); // After 100ms
      }, 100);
      
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToBottom(); // After 500ms
      }, 500);
    }
  }, [conversationId, previousConversationId, scrollToBottom]);

  // Auto-scroll to bottom when messages are first loaded for a conversation
  useEffect(() => {
    if (messages.length > 0 && !isLoading && !isLoadingMore && conversationId && !userHasScrolled) {
      console.log('🔄 Messages loaded, scrolling to bottom:', { 
        messageCount: messages.length, 
        conversationId 
      });
      
      // Use a small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages.length, isLoading, isLoadingMore, conversationId, userHasScrolled, scrollToBottom]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Handle scroll to detect when user reaches top to load older messages
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const isAtTop = container.scrollTop === 0;
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10; // 10px threshold
    
    // Mark that user has manually scrolled
    if (!isAtBottom) {
      setUserHasScrolled(true);
    } else {
      // If user scrolls back to bottom, allow auto-scroll again
      setUserHasScrolled(false);
    }
    
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
        className="flex flex-col h-full overflow-y-auto scrollbar-fixed"
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
              avatarUrl={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                message.sender === 'agent' 
                  ? (agentName || (message.senderId === 'admin_001' ? 'Admin' : 'Agent'))
                  : (contactName || 'Customer')
              )}&background=random`}
              showAvatar={true}
              contactName={contactName}
              agentName={agentName}
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

