'use client';

import { useState, useEffect, useMemo } from 'react';
import { useChatStore } from '@/store/chat-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDistanceToNow, format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { 
  Phone, 
  Mail, 
  User, 
  MoreVertical, 
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Pin,
  PinOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from '@/components/ui/status-badge';
import { StatusToggle } from '@/components/ui/status-toggle';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { ConversationTabFilter, TabFilterType } from './conversation-tab-filter';
import { AgentAssignmentDialog } from './agent-assignment-dialog';
import { NewConversationTemplateModal } from './new-conversation-template-modal';
import type { StatusFilter } from './conversation-status-priority-filter';

interface ConversationItem {
  id: string;
  title: string;
  lastMessagePreview: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  agentId: string;
  // Additional information for enhanced display
  customerPhone?: string;
  customerEmail?: string;
  agentName?: string;
  agentStatus?: string;
  status?: 'open' | 'closed' | 'pending';
  isPinned?: boolean;
  isNew?: boolean;
  isUnreplied?: boolean;
}

interface OptimizedChatListProps {
  agentId?: string;
}

// Helper function to format time
const formatMessageTime = (date: string | Date) => {
  const messageDate = new Date(date);
  const now = new Date();
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  } else if (isYesterday(messageDate)) {
    return format(messageDate, 'HH:mm');
  } else {
    const daysDiff = differenceInDays(now, messageDate);
    if (daysDiff < 7) {
      return `${daysDiff}d`;
    } else {
      return format(messageDate, 'MM/dd');
    }
  }
};

export function OptimizedChatList({ agentId }: OptimizedChatListProps) {
  const {
    conversations,
    selectedConversationId, 
    setSelectedConversation,
    setConversations,
    isLoading,
    error,
    isConversationPinned,
    updateConversationStatus,
    assignments,
    loadAssignmentsFromDatabase
  } = useChatStore();
  
  // Use conversations from store instead of local state
  const [hasMore, setHasMore] = useState(false);
  
  // Debug: Log conversation data to see real-time updates
  console.log('🔍 OptimizedChatList - Current conversations from store:', conversations.map(conv => ({
    id: conv.id,
    title: conv.title,
    lastMessagePreview: conv.lastMessagePreview,
    isUnreplied: conv.isUnreplied,
    updatedAt: conv.updatedAt
  })));
  
  // Debug: Check specifically for Abdelrahman Baraka conversation
  const abdelrahmanConv = conversations.find(conv => conv.title === 'Abdelrahman Baraka');
  if (abdelrahmanConv) {
    console.log('🔍 OptimizedChatList - Abdelrahman Baraka conversation details:', {
      id: abdelrahmanConv.id,
      title: abdelrahmanConv.title,
      lastMessagePreview: abdelrahmanConv.lastMessagePreview,
      isUnreplied: abdelrahmanConv.isUnreplied,
      status: abdelrahmanConv.status,
      updatedAt: abdelrahmanConv.updatedAt
    });
  }
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [selectedConversationForAssignment, setSelectedConversationForAssignment] = useState<string | null>(null);

  // Handle status updates from conversation list
  const handleStatusUpdate = async (conversationId: string, newStatus: 'open' | 'closed' | 'pending') => {
    try {
      console.log('🔍 Conversation list - updating status:', { conversationId, newStatus });
      
      const response = await fetch(`/api/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update conversation status');
      }

      // Update the store
      updateConversationStatus(conversationId, newStatus);
      
      console.log('🔍 Conversation list - status updated successfully');
    } catch (error) {
      console.error('Error updating conversation status from list:', error);
    }
  };

  // Handle opening agent assignment dialog
  const handleOpenAgentDialog = (conversationId: string) => {
    console.log('🔍 Opening agent assignment dialog for conversation:', conversationId);
    setSelectedConversationForAssignment(conversationId);
    setShowAgentDialog(true);
  };

  // Load initial conversations and assignments
  useEffect(() => {
    console.log('🔍 OptimizedChatList - agentId:', agentId);
    if (agentId) {
      console.log('🔍 Auto-loading assignments first, then conversations...');
      // Load assignments first, then conversations
      loadAssignmentsFromDatabase().then(() => {
        loadConversations();
      });
    } else {
      console.log('🔍 No agentId, not loading conversations');
    }
  }, [agentId, loadAssignmentsFromDatabase]);

  const loadConversations = async (cursor?: string) => {
    try {
      if (cursor) {
        setIsLoadingMore(true);
      } else {
        setIsInitialLoad(true);
      }
      
      // Try the new optimized API first
      try {
        const url = new URL('/api/twilio/conversations', window.location.origin);
        url.searchParams.set('lite', '1');
        url.searchParams.set('limit', '20');
        url.searchParams.set('agentId', agentId || '');
        if (cursor) {
          url.searchParams.set('after', cursor);
        }
        
        const response = await fetch(url.toString());
        console.log('🔍 Lite API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Lite API data:', data);
          
          if (cursor) {
            const newConversations = [...conversations, ...data.items];
            setConversations(newConversations);
          } else {
            setConversations(data.items);
            // Auto-select the first conversation if none is selected
            if (data.items.length > 0 && !selectedConversationId) {
              console.log('🔍 Auto-selecting first conversation:', data.items[0].id);
              setSelectedConversation(data.items[0].id);
            }
          }
          
          setNextCursor(data.nextCursor);
          setHasMore(!!data.nextCursor);
          return;
        }
      } catch (apiError) {
        console.log('New API failed, falling back to old API:', apiError);
      }
      
      // Fallback to the old working API
      const fallbackUrl = new URL('/api/twilio/conversations', window.location.origin);
      fallbackUrl.searchParams.set('agentId', agentId || '');
      fallbackUrl.searchParams.set('limit', '20');
      fallbackUrl.searchParams.set('messageLimit', '0'); // Don't load messages
      
          const fallbackResponse = await fetch(fallbackUrl.toString());
          console.log('🔍 Fallback API response status:', fallbackResponse.status);
          if (!fallbackResponse.ok) {
            throw new Error('Failed to fetch conversations from both APIs');
          }
          
          const fallbackData = await fallbackResponse.json();
          console.log('🔍 Fallback API data:', fallbackData);
      
      if (fallbackData.success && fallbackData.conversations) {
        // Convert old format to new format
        const convertedItems = fallbackData.conversations.map((conv: any) => ({
          id: conv.id,
          title: conv.customer.name,
          lastMessagePreview: conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].text : '',
          unreadCount: conv.unreadCount || 0,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          customerId: conv.customer.id,
          agentId: conv.agent.id,
          isUnreplied: false, // Default to false, will be overridden by store data if available
        }));
        
        if (cursor) {
          const newConversations = [...conversations, ...convertedItems];
          setConversations(newConversations);
        } else {
          setConversations(convertedItems);
          // Auto-select the first conversation if none is selected
          if (convertedItems.length > 0 && !selectedConversationId) {
            console.log('🔍 Auto-selecting first conversation (fallback):', convertedItems[0].id);
            setSelectedConversation(convertedItems[0].id);
          }
        }
        
        setNextCursor(null); // Old API doesn't support pagination
        setHasMore(false);
      }
      
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoadingMore(false);
      setIsInitialLoad(false);
    }
  };

  const loadMore = () => {
    if (hasMore && nextCursor && !isLoadingMore) {
      loadConversations(nextCursor);
    }
  };


  // Filter conversations based on active tab, status, and search query
  const filteredConversations = useMemo(() => {
    console.log('🔍 Filtering conversations:', { 
      activeTab, 
      conversationsCount: conversations.length, 
      assignmentsCount: Object.keys(assignments).length,
      assignments: assignments 
    });
    let filtered = conversations;

    // Apply tab filter first - use store assignments as source of truth
    if (activeTab === 'assigned') {
      // Only show conversations assigned to the current agent (from store)
      filtered = filtered.filter(conv => {
        const assignment = assignments[conv.id];
        const isAssigned = assignment && assignment.id === agentId;
        console.log('🔍 Assigned filter check:', {
          conversationId: conv.id,
          conversationTitle: conv.title,
          assignment,
          agentId,
          conversationStatus: conv.status,
          isAssigned
        });
        return isAssigned;
      });
    } else if (activeTab === 'unassigned') {
      // Show conversations with no assignment in store (database source of truth)
      // Include both open and closed unassigned conversations
      filtered = filtered.filter(conv => {
        const assignment = assignments[conv.id];
        const isUnassigned = !assignment;
        console.log('🔍 Unassigned filter check:', {
          conversationId: conv.id,
          conversationTitle: conv.title,
          assignment,
          isUnassigned
        });
        return isUnassigned;
      });
    }
    // 'all' tab shows all conversations, no additional filtering needed

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => {
        const assignment = assignments[conv.id];
        const assignedAgentName = assignment?.name || '';
        
        return conv.title.toLowerCase().includes(query) ||
               conv.customerPhone?.includes(query) ||
               conv.customerEmail?.toLowerCase().includes(query) ||
               assignedAgentName.toLowerCase().includes(query) ||
               conv.lastMessagePreview?.toLowerCase().includes(query);
      });
    }

    // Sort: pinned conversations first, then open conversations, then new conversations, then by updatedAt, with stable secondary sort
    filtered.sort((a, b) => {
      // Pinned conversations first (use store state)
      const aPinned = isConversationPinned(a.id);
      const bPinned = isConversationPinned(b.id);
      
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      // Then open conversations (if not pinned)
      if (!aPinned && !bPinned) {
        const aOpen = a.status === 'open';
        const bOpen = b.status === 'open';
        
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;
      }
      
      // Then new conversations (if not pinned and same status)
      if (!aPinned && !bPinned && a.status === b.status) {
        const aNew = a.isNew === true;
        const bNew = b.isNew === true;
        
        if (aNew && !bNew) return -1;
        if (!aNew && bNew) return 1;
      }
      
      // Then by updatedAt (most recent first)
      const timeDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      
      // Stable secondary sort by ID to prevent random reordering
      return a.id.localeCompare(b.id);
    });

    return filtered;
  }, [conversations, activeTab, agentId, statusFilter, searchQuery, isConversationPinned]);

  // Calculate status counts
  const tabCounts = useMemo(() => {
    // Status counts
    const statusCounts = {
      all: conversations.length,
      open: conversations.filter(conv => conv.status === 'open').length,
      closed: conversations.filter(conv => conv.status === 'closed').length
    };
    
    console.log('🔍 Status counts calculation:', {
      totalConversations: conversations.length,
      statusCounts,
      conversations: conversations.map(c => ({
        id: c.id,
        title: c.title,
        status: c.status
      }))
    });
    
    return { 
      status: statusCounts
    };
  }, [conversations]);

  if ((isLoading || isInitialLoad) && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-2">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <p>Error loading conversations: {error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab Filter */}
      <ConversationTabFilter
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
        counts={tabCounts}
        currentAgentId={agentId}
        statusFilter={statusFilter}
      />
      
      <div className="flex-1 overflow-y-auto scrollbar-hover">
        {/* Show new conversation modal when no search results found */}
        {searchQuery.trim() && filteredConversations.length === 0 && (
          <NewConversationTemplateModal 
            searchQuery={searchQuery}
            onMessageSent={() => {
              // Refresh conversations after sending template
              loadConversations();
            }}
          />
        )}
        
        {filteredConversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`w-full p-3 mb-1 rounded-lg border transition-colors cursor-pointer ${
              selectedConversationId === conversation.id 
                ? "bg-secondary border-primary" 
                : "bg-card hover:bg-muted/50"
            }`}
            onClick={async () => {
              console.log('Selecting conversation:', conversation.id);
              setSelectedConversation(conversation.id);
              
              // Mark conversation as read if it's new
              if (conversation.isNew) {
                try {
                  const response = await fetch(`/api/conversations/${conversation.id}/mark-read`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });
                  
                  if (response.ok) {
                    console.log('✅ Conversation marked as read:', conversation.id);
                    // Update the conversation in the store to remove the new indicator
                    const updatedConversations = conversations.map(conv => 
                      conv.id === conversation.id ? { ...conv, isNew: false } : conv
                    );
                    setConversations(updatedConversations);
                  }
                } catch (error) {
                  console.error('Error marking conversation as read:', error);
                }
              }
            }}
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.title)}&background=random`}
                    alt={conversation.title}
                    width={40}
                    height={40}
                  />
                  <AvatarFallback>
                    {(() => {
                      // Generate proper initials from conversation title
                      const words = conversation.title.trim().split(' ');
                      if (words.length >= 2) {
                        return (words[0][0] + words[1][0]).toUpperCase();
                      } else if (words.length === 1) {
                        return words[0].substring(0, 2).toUpperCase();
                      }
                      return conversation.title.charAt(0).toUpperCase();
                    })()}
                  </AvatarFallback>
                </Avatar>
                {/* New conversation indicator */}
                {conversation.isNew && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse" title="New conversation" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">
                      {conversation.title}
                    </h3>
                    {(() => {
                      console.log('🔍 Rendering unreplied dot for:', {
                        title: conversation.title,
                        isUnreplied: conversation.isUnreplied,
                        shouldShow: conversation.isUnreplied
                      });
                      return conversation.isUnreplied && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" title="Unreplied message" />
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-1">
                    {isConversationPinned(conversation.id) && (
                      <Pin className="h-3 w-3 text-yellow-500" />
                    )}
                    {conversation.status && <StatusBadge status={conversation.status} />}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAgentDialog(conversation.id);
                        }}>
                          <User className="h-4 w-4 mr-2" />
                          Assign Agent
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newStatus = conversation.status === 'open' ? 'closed' : 'open';
                            handleStatusUpdate(conversation.id, newStatus);
                          }}
                        >
                          {conversation.status === 'open' ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Close Conversation
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Reopen Conversation
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={async (e) => {
                          e.stopPropagation();
                          const { toggleConversationPin } = useChatStore.getState();
                          await toggleConversationPin(conversation.id);
                        }}>
                          {isConversationPinned(conversation.id) ? (
                            <>
                              <PinOff className="h-4 w-4 mr-2" />
                              Unpin Conversation
                            </>
                          ) : (
                            <>
                              <Pin className="h-4 w-4 mr-2" />
                              Pin Conversation
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Contact info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  {conversation.customerPhone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{conversation.customerPhone}</span>
                    </div>
                  )}
                  {conversation.customerEmail && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{conversation.customerEmail}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground truncate flex-1">
                    {conversation.lastMessagePreview || 'No messages yet'}
                  </p>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {conversation.updatedAt ? formatMessageTime(conversation.updatedAt) : 'now'}
                  </span>
                </div>
                
                <div className="flex items-center justify-end">
                  {conversation.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {hasMore && filteredConversations.length > 0 && (
          <div className="p-4 text-center">
            <Button 
              variant="outline" 
              onClick={loadMore}
              disabled={isLoadingMore}
              className="w-full"
            >
              {isLoadingMore ? <LoadingSpinner size="sm" /> : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      {/* Agent Assignment Dialog */}
      {selectedConversationForAssignment && (
        <AgentAssignmentDialog
          open={showAgentDialog}
          onOpenChange={(open) => {
            setShowAgentDialog(open);
            if (!open) {
              setSelectedConversationForAssignment(null);
            }
          }}
          conversationId={selectedConversationForAssignment}
          currentAgentId={conversations.find(c => c.id === selectedConversationForAssignment)?.agentId}
          onAgentAssigned={(conversationId, agentId) => {
            console.log('🔍 Agent assigned from conversation list:', { conversationId, agentId });
            // The dialog already updates the store, so we just need to close it
            setShowAgentDialog(false);
            setSelectedConversationForAssignment(null);
          }}
        />
      )}
    </div>
  );
}
