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
    error,
    loadAssignmentsFromDatabase
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
  } = useMessages(selectedConversationId || undefined);

  // Enable real-time messaging for incoming messages
  useRealtimeMessages({
    loggedInAgentId: loggedInAgent.id
  });

  // OptimizedChatLayout render

  // Get the selected conversation from the store
  const selectedConversation = useChatStore(state => {
    if (!selectedConversationId) return null;
    return state.conversations.find(conv => conv.id === selectedConversationId) || null;
  });

  // Check assignment status from the store
  const assignedAgent = useChatStore(state => 
    selectedConversationId ? state.assignments[selectedConversationId] : null
  );
  
  // Check if the conversation is assigned to the current user
  const isAssignedToCurrentUser = assignedAgent?.id === loggedInAgent.id;
  const isUnassigned = !assignedAgent;
  const isAssignedToOtherAgent = assignedAgent && assignedAgent.id !== loggedInAgent.id;
  
  const messageInputDisabled = !isAssignedToCurrentUser;
  const messageInputDisabledReason = isUnassigned 
    ? "This conversation is not assigned to any agent. Please assign it to yourself first."
    : isAssignedToOtherAgent 
    ? `This conversation is assigned to ${assignedAgent?.name}. Only the assigned agent can send messages.`
    : "You cannot send messages to this conversation.";

  // Load assignments from database on mount
  useEffect(() => {
    loadAssignmentsFromDatabase();
  }, [loadAssignmentsFromDatabase]);

  // Debug assignment status
  console.log('🔍 Assignment Status:', {
    selectedConversationId,
    assignedAgent,
    loggedInAgent: loggedInAgent,
    loggedInAgentId: loggedInAgent.id,
    isAssignedToCurrentUser,
    isUnassigned,
    isAssignedToOtherAgent,
    messageInputDisabled
  });

  // Management functions
  const handleAssignAgent = useCallback((conversationId: string) => {
    // TODO: Implement agent assignment
    toast({
      title: "Assign Agent",
      description: `Agent assignment for conversation ${conversationId} - Coming soon!`,
    });
  }, [toast]);

  const handleToggleStatus = useCallback(async (conversationId: string, newStatus: 'open' | 'closed' | 'pending') => {
    console.log('🔍 handleToggleStatus called:', { conversationId, newStatus });
    
    try {
      console.log('🔍 Calling status API:', `/api/conversations/${conversationId}/status`);
      const response = await fetch(`/api/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log('🔍 Status API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Status API error:', errorText);
        throw new Error(`Failed to update conversation status: ${response.status} ${errorText}`);
      }

      // Update the store
      console.log('🔍 Updating store with new status:', newStatus);
      const { updateConversationStatus } = useChatStore.getState();
      updateConversationStatus(conversationId, newStatus);

      toast({
        title: "Status Updated",
        description: `Conversation status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating conversation status:', error);
      toast({
        title: "Error",
        description: "Failed to update conversation status. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleChangePriority = useCallback(async (conversationId: string, newPriority: 'low' | 'medium' | 'high') => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/priority`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority: newPriority }),
      });

      if (!response.ok) {
        throw new Error('Failed to update conversation priority');
      }

      // Update the store
      const { updateConversationPriority } = useChatStore.getState();
      updateConversationPriority(conversationId, newPriority);

      toast({
        title: "Priority Updated",
        description: `Conversation priority changed to ${newPriority}`,
      });
    } catch (error) {
      console.error('Error updating conversation priority:', error);
      toast({
        title: "Error",
        description: "Failed to update conversation priority. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/twilio/conversations/${conversationId}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Remove from store
      const { setConversations, setSelectedConversation } = useChatStore.getState();
      const currentConversations = useChatStore.getState().conversations;
      const updatedConversations = currentConversations.filter(conv => conv.id !== conversationId);
      setConversations(updatedConversations);

      // Clear selection if this was the selected conversation
      if (selectedConversationId === conversationId) {
        setSelectedConversation(null);
      }

      toast({
        title: "Conversation Deleted",
        description: "The conversation has been deleted successfully.",
      });

    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, selectedConversationId]);

  // Initialize real-time messages
  useRealtimeMessages({
    loggedInAgentId: loggedInAgent.id
  });

  const handleSendMessage = async (text: string) => {
    
    if (!selectedConversationId || !text.trim()) {
      return;
    }
    
    if (messageInputDisabled) {
      toast({
        title: "Cannot send message",
        description: messageInputDisabledReason,
        variant: "destructive"
      });
      return;
    }
    
    // Add the message to the store immediately for instant UI update with "sending" status
    const { appendMessage, setConversations } = useChatStore.getState();
    const tempMessageId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempMessageId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      sender: 'agent' as const,
      senderId: loggedInAgent.id,
      conversationId: selectedConversationId,
      deliveryStatus: 'sending' as const
    };
    
    appendMessage(selectedConversationId, newMessage);
    
    try {
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
      
      // Message API response status
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Message API error:', errorText);
        
        // Update message status to failed
        const { updateMessageStatus } = useChatStore.getState();
        updateMessageStatus(selectedConversationId, tempMessageId, 'failed');
        
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      // Message sent successfully
      
      // Update the message with the real ID and "sent" status
      const { updateMessageAfterSend } = useChatStore.getState();
      updateMessageAfterSend(selectedConversationId, tempMessageId, {
        id: result.messageId || tempMessageId,
        twilioMessageSid: result.twilioMessageSid,
        deliveryStatus: 'sent' as const
      });
      
      // Update the conversation list with the new last message
      const currentConversations = useChatStore.getState().conversations;
      const updatedConversations = currentConversations.map(conv => 
        conv.id === selectedConversationId 
          ? { ...conv, lastMessagePreview: text.trim(), updatedAt: new Date().toISOString() }
          : conv
      );
      setConversations(updatedConversations);
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          <Button onClick={() => {
            console.log('🔄 Retrying chat load...');
            // Instead of reloading the entire page, just retry the operation
            // This will trigger a re-render and retry the data loading
            window.location.reload();
          }}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Chat List Sidebar - Always visible */}
      <div className="w-96 border-r bg-card flex flex-col h-screen">
        <div className="p-4 border-b flex-shrink-0">
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {selectedConversationId ? (
          <>
            {/* Chat Header */}
                   <OptimizedChatHeader
                     conversationId={selectedConversationId || undefined}
                     conversation={selectedConversation ?? undefined}
                     onRefresh={refreshMessages}
                     onAssignAgent={handleAssignAgent}
                     onToggleStatus={handleToggleStatus}
                     onChangePriority={handleChangePriority}
                     onDeleteConversation={handleDeleteConversation}
                   />

            {/* Messages Area - Takes remaining space */}
            <div className="flex-1 overflow-hidden">
              <VirtualMessageList
                messages={messages}
                isLoading={messagesLoading}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onLoadOlder={loadOlder}
                className="h-full"
                contactName={selectedConversation?.title}
              />
            </div>

            {/* Message Input - Always at bottom */}
            <div className="flex-shrink-0">
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={messageInputDisabled}
                disabledReason={messageInputDisabled ? messageInputDisabledReason : undefined}
              />
            </div>
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
