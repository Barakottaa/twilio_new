'use client';

import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import type { Agent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import { useMessages } from '@/hooks/use-messages';
import { useChatStore } from '@/store/chat-store';
import { OptimizedChatList } from './optimized-chat-list';
import { VirtualMessageList } from './virtual-message-list';
import { MessageInput } from './message-input';
import { OptimizedChatHeader } from './optimized-chat-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Lazy load heavy components
const ChatView = lazy(() => import('./chat-view').then(module => ({ default: module.ChatView })));

interface OptimizedChatLayoutProps {
  loggedInAgent: Agent;
}

export function OptimizedChatLayout({ loggedInAgent }: OptimizedChatLayoutProps) {
  const { 
    selectedConversationId, 
    setSelectedConversation,
    isLoading,
    error 
  } = useChatStore();
  
  const { toast } = useToast();
  
  // Use the messages hook for both fetching and real-time updates
  const {
    messages,
    isLoading: messagesLoading,
    isLoadingMore,
    hasMore,
    loadOlder,
    refresh: refreshMessages,
    error: messagesError
  } = useMessages(selectedConversationId);

  console.log('🔍 OptimizedChatLayout - selectedConversationId:', selectedConversationId);
  console.log('🔍 OptimizedChatLayout - messages:', messages);
  console.log('🔍 OptimizedChatLayout - messagesLoading:', messagesLoading);

  // Check if the conversation is assigned to the current user
  const isAssignedToCurrentUser = selectedConversation?.agentId === loggedInAgent.id;
  const isUnassigned = selectedConversation?.agentName === 'Unassigned' || !selectedConversation?.agentId;
  
  const messageInputDisabled = !isAssignedToCurrentUser;
  const messageInputDisabledReason = isUnassigned 
    ? "This conversation is not assigned to any agent. Please assign it to yourself first."
    : `This conversation is assigned to ${selectedConversation?.agentName}. Only the assigned agent can send messages.`;

  // Management functions
  const handleAssignAgent = useCallback((conversationId: string) => {
    // TODO: Implement agent assignment
    toast({
      title: "Assign Agent",
      description: `Agent assignment for conversation ${conversationId} - Coming soon!`,
    });
  }, [toast]);

  const handleToggleStatus = useCallback((conversationId: string, newStatus: 'open' | 'closed' | 'pending') => {
    // TODO: Implement status toggle
    toast({
      title: "Status Updated",
      description: `Conversation status changed to ${newStatus} - Coming soon!`,
    });
  }, [toast]);

  const handleChangePriority = useCallback((conversationId: string, newPriority: 'low' | 'medium' | 'high') => {
    // TODO: Implement priority change
    toast({
      title: "Priority Updated",
      description: `Conversation priority changed to ${newPriority} - Coming soon!`,
    });
  }, [toast]);

  // Initialize real-time messages
  useRealtimeMessages({
    chats: [], // Not needed with new store
    setChats: () => {}, // Not needed with new store
    setSelectedChat: () => {}, // Not needed with new store
    loggedInAgentId: loggedInAgent.id
  });

  const handleSendMessage = async (text: string) => {
    if (!selectedConversationId || !text.trim()) {
      console.log('🔍 Cannot send message - missing conversationId or text:', { selectedConversationId, text });
      return;
    }
    
    if (messageInputDisabled) {
      console.log('🔍 Cannot send message - conversation not assigned to current user:', { 
        selectedConversationId, 
        agentId: selectedConversation?.agentId, 
        loggedInAgentId: loggedInAgent.id 
      });
      toast({
        title: "Cannot send message",
        description: messageInputDisabledReason,
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log('🔍 Sending message:', text, 'to conversation:', selectedConversationId);
      
      // Call the send message API
      const response = await fetch(`/api/twilio/conversations/${selectedConversationId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text.trim(),
          author: loggedInAgent.id
        })
      });
      
      console.log('🔍 Message API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Message API error:', errorText);
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('🔍 Message sent successfully:', result);
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      
      // Refresh messages to show the new message
      refreshMessages();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectedConversation = useChatStore(state => 
    state.conversations.find(conv => conv.id === selectedConversationId)
  );

  // Debug logging
  useEffect(() => {
    console.log('🔍 OptimizedChatLayout - selectedConversationId:', selectedConversationId);
    console.log('🔍 OptimizedChatLayout - selectedConversation:', selectedConversation);
    console.log('🔍 OptimizedChatLayout - all conversations:', useChatStore.getState().conversations);
  }, [selectedConversationId, selectedConversation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Chats</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Chat List Sidebar - Always visible */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Conversations</h2>
            {selectedConversationId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversation(null)}
                className="text-xs"
              >
                ← Back
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <OptimizedChatList agentId={loggedInAgent.id} />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedConversationId ? (
          <>
            {/* Chat Header */}
            <OptimizedChatHeader 
              conversation={selectedConversation}
              onRefresh={refreshMessages}
              onAssignAgent={handleAssignAgent}
              onToggleStatus={handleToggleStatus}
              onChangePriority={handleChangePriority}
            />

            {/* Messages Area - Scroll handled by VirtualMessageList */}
            <div className="flex-1">
              <VirtualMessageList
                messages={messages}
                isLoading={messagesLoading}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onLoadOlder={loadOlder}
                className="h-full"
              />
            </div>

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={messageInputDisabled}
              disabledReason={messageInputDisabled ? messageInputDisabledReason : undefined}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Select a Conversation
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the list to start chatting
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
