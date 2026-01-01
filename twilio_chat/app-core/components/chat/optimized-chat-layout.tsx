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
import { TemplateSelector } from './template-selector';
import { TemplateSendDialog } from './template-send-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Lazy load heavy components

interface OptimizedChatLayoutProps {
  loggedInAgent: Agent;
}

export function OptimizedChatLayout({ loggedInAgent }: OptimizedChatLayoutProps) {
  const {
    selectedConversationId,
    setSelectedConversation,
    isLoading,
    error,
    loadAssignmentsFromDatabase,
    setAssignment
  } = useChatStore();

  const { toast } = useToast();

  // Handle assigning conversation to current user
  const [isAssigning, setIsAssigning] = useState(false);
  const [lastCustomerMessage, setLastCustomerMessage] = useState<string | undefined>();
  const [isCheckingWindow, setIsCheckingWindow] = useState(true); // Track if we're still checking 24h window
  const [showTemplateDialog, setShowTemplateDialog] = useState(false); // Template dialog state

  // Get selected phone number from store
  const selectedNumberId = useChatStore(state => state.selectedNumberId);

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
  const assignedAgent = useChatStore(state => {
    const assignment = selectedConversationId ? state.assignments[selectedConversationId] : null;
    console.log('🔍 Getting assignment for conversation:', selectedConversationId, 'assignment:', assignment, 'all assignments:', state.assignments);
    return assignment;
  });

  // Get conversation status to determine if assignment should be considered
  const conversationStatus = useChatStore(state => {
    const status = selectedConversationId ? state.statuses[selectedConversationId] : 'open';
    console.log('🔍 Getting status for conversation:', selectedConversationId, 'status:', status);
    return status;
  });

  // Check if the conversation is assigned to the current user
  const isAssignedToCurrentUser = assignedAgent?.id === loggedInAgent.id;
  const isUnassigned = !assignedAgent;
  const isAssignedToOtherAgent = assignedAgent && assignedAgent.id !== loggedInAgent.id;

  // Message input should be disabled if not assigned to current user (regardless of conversation status)
  const messageInputDisabled = !isAssignedToCurrentUser;

  const messageInputDisabledReason = isUnassigned
    ? "This conversation is not assigned to any agent."
    : isAssignedToOtherAgent
      ? `This conversation is assigned to ${assignedAgent?.name}. Only the assigned agent can send messages.`
      : "You cannot send messages to this conversation.";

  // Show assign button for unassigned or assigned-to-other conversations (regardless of conversation status)
  const showAssignButton = isUnassigned || isAssignedToOtherAgent;

  // Load assignments from database on mount
  useEffect(() => {
    console.log('🔍 OptimizedChatLayout - Loading assignments on mount...');
    loadAssignmentsFromDatabase();
  }, [loadAssignmentsFromDatabase]);

  // Load assignments when conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      console.log('🔍 OptimizedChatLayout - Loading assignments for conversation:', selectedConversationId);
      loadAssignmentsFromDatabase();
    }
  }, [selectedConversationId, loadAssignmentsFromDatabase]);

  // Find last customer message for 24-hour window check
  useEffect(() => {
    if (!selectedConversationId) {
      setIsCheckingWindow(false);
      setLastCustomerMessage(undefined);
      return;
    }

    // If messages are still loading, keep checking state
    if (messagesLoading) {
      setIsCheckingWindow(true);
      return;
    }

    // Messages have loaded, now check for customer messages
    setIsCheckingWindow(false);

    if (messages.length > 0) {
      console.log('🔍 Finding last customer message from messages:', messages.length);

      // Filter customer messages and sort by timestamp (most recent first)
      const customerMessages = messages
        .filter((msg: any) => {
          const isCustomer = (msg.sender === 'contact') ||
            (msg.sender === 'customer') ||
            (msg.senderType === 'customer') ||
            (msg.author && !msg.author.startsWith('agent') && !msg.author.startsWith('admin'));
          return isCustomer;
        })
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      console.log('👤 Customer messages found:', customerMessages.length);
      if (customerMessages.length > 0) {
        const lastCustomerMsg = customerMessages[0]; // Most recent customer message
        console.log('✅ Last customer message:', {
          text: lastCustomerMsg.text,
          timestamp: lastCustomerMsg.timestamp,
          sender: lastCustomerMsg.sender
        });
        setLastCustomerMessage(lastCustomerMsg.timestamp);
      } else {
        console.log('❌ No customer messages found');
        setLastCustomerMessage(undefined);
      }
    } else {
      // No messages - new conversation
      console.log('📝 No messages - new conversation');
      setLastCustomerMessage(undefined);
    }
  }, [selectedConversationId, messages, messagesLoading]);

  const handleAssignToMe = async () => {
    if (!selectedConversationId || isAssigning) return;

    setIsAssigning(true);
    try {
      const response = await fetch(`/api/conversations/${selectedConversationId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId: loggedInAgent.id }),
      });

      if (response.ok) {
        // Refresh assignments from database to ensure consistency
        await loadAssignmentsFromDatabase();

        toast({
          title: "Conversation Assigned",
          description: "This conversation has been assigned to you.",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || 'Failed to assign conversation';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error assigning conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Assignment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };


  // Debug assignment status
  console.log('🔍 Assignment Status:', {
    selectedConversationId,
    assignedAgent,
    assignedAgentId: assignedAgent?.id,
    assignedAgentName: assignedAgent?.name,
    loggedInAgent: loggedInAgent,
    loggedInAgentId: loggedInAgent.id,
    loggedInAgentName: loggedInAgent.name,
    isAssignedToCurrentUser,
    isUnassigned,
    isAssignedToOtherAgent,
    messageInputDisabled,
    messageInputDisabledReason,
    showAssignButton,
    conversationStatus,
    allAssignments: useChatStore.getState().assignments,
    allStatuses: useChatStore.getState().statuses
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

      // Refresh assignments and statuses from database to ensure consistency
      console.log('🔍 Refreshing assignments and statuses from database...');
      await loadAssignmentsFromDatabase();

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

  // Real-time messages are already initialized above - removing duplicate call

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

    console.log('📤 Adding temporary message to store:', {
      tempId: tempMessageId,
      text: text.trim(),
      conversationId: selectedConversationId
    });

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
          author: loggedInAgent.id,
          fromNumberId: selectedNumberId // Pass selected number ID for sending
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
      const { updateMessageAfterSend, setStatus } = useChatStore.getState();
      console.log('📤 Updating message after successful send:', {
        tempId: tempMessageId,
        realId: result.messageId || tempMessageId,
        twilioSid: result.twilioMessageSid,
        conversationId: selectedConversationId
      });

      updateMessageAfterSend(selectedConversationId, tempMessageId, {
        id: result.messageId || tempMessageId,
        twilioMessageSid: result.twilioMessageSid,
        deliveryStatus: 'sent' as const
      });

      // Set a timeout to update delivery status to "delivered" if no webhook is received
      setTimeout(() => {
        const { updateMessageStatus } = useChatStore.getState();
        const messages = useChatStore.getState().messages[selectedConversationId] || [];
        const message = messages.find(msg => msg.id === (result.messageId || tempMessageId));
        if (message && message.deliveryStatus === 'sent') {
          console.log('🔍 Auto-updating message status to delivered (fallback)');
          updateMessageStatus(selectedConversationId, message.id, 'delivered');
        }
      }, 3000); // Wait 3 seconds before auto-updating to delivered

      // Update conversation status to "open" if it was closed (agent is now participating)
      const currentStatus = useChatStore.getState().statuses[selectedConversationId];
      if (currentStatus === 'closed') {
        console.log('🔍 Agent sent message to closed conversation, reopening...');
        setStatus(selectedConversationId, 'open');

        // Also update in database
        try {
          await fetch(`/api/conversations/${selectedConversationId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'open' }),
          });
        } catch (error) {
          console.error('Failed to update conversation status in database:', error);
        }
      }

      // Ensure the conversation is assigned to the current agent when they send a message
      const currentAssignment = useChatStore.getState().assignments[selectedConversationId];
      if (!currentAssignment || currentAssignment.id !== loggedInAgent.id) {
        console.log('🔍 Agent sent message, ensuring assignment to current agent...');

        // Update in database
        try {
          await fetch(`/api/conversations/${selectedConversationId}/assign`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ agentId: loggedInAgent.id }),
          });

          // Refresh assignments from database to ensure consistency
          await loadAssignmentsFromDatabase();
        } catch (error) {
          console.error('Failed to update conversation assignment in database:', error);
        }
      }

      // Update the conversation list with the new last message
      const currentConversations = useChatStore.getState().conversations;
      const updatedConversations = currentConversations.map(conv => {
        if (conv.id === selectedConversationId) {
          return {
            ...conv,
            lastMessagePreview: text.trim(),
            updatedAt: new Date().toISOString(),
            status: ('open' as 'open' | 'closed' | 'pending')
          };
        }
        return conv;
      });
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
              loggedInAgent={loggedInAgent}
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
                agentName={loggedInAgent.name}
                conversationId={selectedConversationId}
              />
            </div>

            {/* Message Input Section - Show skeleton while checking 24h window, then show template selector or message input */}
            <div className="flex-shrink-0">
              {isCheckingWindow || messagesLoading ? (
                // Show skeleton while checking 24-hour window or loading messages
                <div className="border-t bg-muted/30 p-4">
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-10 bg-muted rounded"></div>
                    <div className="h-9 bg-muted rounded w-1/3"></div>
                  </div>
                </div>
              ) : selectedConversation && (
                (() => {
                  // Check if we're outside 24-hour window
                  const isOutsideWindow = lastCustomerMessage ? (() => {
                    const lastMessageTime = new Date(lastCustomerMessage);
                    const now = new Date();
                    const timeDiff = now.getTime() - lastMessageTime.getTime();
                    const hoursDiff = timeDiff / (1000 * 60 * 60);
                    return hoursDiff > 24;
                  })() : true; // If no customer message, consider it outside window (new conversation)

                  // Show template selector ONLY if outside 24-hour window
                  // Unassigned chats should show regular message input with "Assign to Me" button
                  if (isOutsideWindow) {
                    return (
                      <TemplateSelector
                        conversationId={selectedConversationId || ''}
                        customerPhone={selectedConversation.customerPhone || ''}
                        customerName={selectedConversation.title || 'Customer'}
                        lastCustomerMessage={lastCustomerMessage || undefined}
                        onMessageSent={(message) => {
                          toast({
                            title: "Template sent",
                            description: "Template message sent successfully.",
                          });
                          // Refresh messages to show the new message
                          refreshMessages();
                        }}
                        showRegularInput={false}
                        regularInputProps={undefined}
                      />
                    );
                  } else {
                    // Inside 24-hour window - show regular message input (may be disabled if unassigned)
                    // Add template button for sending templates to open conversations
                    return (
                      <>
                        <MessageInput
                          onSendMessage={handleSendMessage}
                          disabled={messageInputDisabled}
                          disabledReason={messageInputDisabled ? messageInputDisabledReason : undefined}
                          onAssignToMe={handleAssignToMe}
                          showAssignButton={showAssignButton ?? undefined}
                          isAssigning={isAssigning}
                          onSendTemplate={() => setShowTemplateDialog(true)}
                          showTemplateButton={isAssignedToCurrentUser && !messageInputDisabled}
                        />
                        <TemplateSendDialog
                          open={showTemplateDialog}
                          onOpenChange={setShowTemplateDialog}
                          conversationId={selectedConversationId || ''}
                          customerPhone={selectedConversation.customerPhone || ''}
                          customerName={selectedConversation.title || 'Customer'}
                          onTemplateSent={async () => {
                            // Refresh messages to show the new template message
                            await refreshMessages();
                            setShowTemplateDialog(false);
                          }}
                        />
                      </>
                    );
                  }
                })()
              )}
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
