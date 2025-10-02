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
import { PriorityBadge } from '@/components/ui/priority-badge';
import { ConversationTabFilter, TabFilterType } from './conversation-tab-filter';
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
    error 
  } = useChatStore();
  
  // Use conversations from store instead of local state
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Load initial conversations
  useEffect(() => {
    console.log('🔍 OptimizedChatList - agentId:', agentId);
    if (agentId) {
      console.log('🔍 Auto-loading conversations...');
      loadConversations();
    } else {
      console.log('🔍 No agentId, not loading conversations');
    }
  }, [agentId]);

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
    let filtered = conversations;

    // Apply tab filter first
    if (activeTab === 'assigned') {
      filtered = filtered.filter(conv => conv.agentId === agentId);
    } else if (activeTab === 'unassigned') {
      filtered = filtered.filter(conv => 
        !conv.agentId || 
        conv.agentId === 'unassigned' || 
        conv.agentId === 'unknown' ||
        conv.agentName === 'Unassigned'
      );
    }
    // 'all' tab shows all conversations, no additional filtering needed

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.title.toLowerCase().includes(query) ||
        conv.customerPhone?.includes(query) ||
        conv.customerEmail?.toLowerCase().includes(query) ||
        conv.agentName?.toLowerCase().includes(query) ||
        conv.lastMessagePreview?.toLowerCase().includes(query)
      );
    }

    // Sort: pinned conversations first, then by updatedAt
    filtered.sort((a, b) => {
      // Pinned conversations first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then by updatedAt (most recent first)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return filtered;
  }, [conversations, activeTab, agentId, statusFilter, searchQuery]);

  // Calculate tab counts
  const tabCounts = useMemo(() => {
    const all = conversations.length;
    const assigned = conversations.filter(conv => conv.agentId === agentId).length;
    const unassigned = conversations.filter(conv => 
      !conv.agentId || 
      conv.agentId === 'unassigned' || 
      conv.agentId === 'unknown' ||
      conv.agentName === 'Unassigned'
    ).length;
    
    // Status counts
    const statusCounts = {
      all: conversations.length,
      open: conversations.filter(conv => conv.status === 'open').length,
      closed: conversations.filter(conv => conv.status === 'closed').length
    };
    
    console.log('🔍 Tab counts calculation:', {
      totalConversations: conversations.length,
      agentId,
      all,
      assigned,
      unassigned,
      statusCounts,
      conversations: conversations.map(c => ({
        id: c.id,
        title: c.title,
        agentId: c.agentId,
        agentName: c.agentName,
        status: c.status,
        isPinned: c.isPinned
      }))
    });
    
    return { 
      all, 
      assigned, 
      unassigned,
      status: statusCounts
    };
  }, [conversations, agentId]);

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
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`w-full p-3 mb-1 rounded-lg border transition-colors cursor-pointer ${
              selectedConversationId === conversation.id 
                ? "bg-secondary border-primary" 
                : "bg-card hover:bg-muted/50"
            }`}
            onClick={() => {
              console.log('Selecting conversation:', conversation.id);
              setSelectedConversation(conversation.id);
            }}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.title)}&background=random`}
                  alt={conversation.title}
                  width={40}
                  height={40}
                />
                <AvatarFallback>
                  {conversation.title.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-sm truncate">
                    {conversation.title}
                  </h3>
                  <div className="flex items-center gap-1">
                    {conversation.isPinned && (
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
                        <DropdownMenuItem>
                          <User className="h-4 w-4 mr-2" />
                          Assign Agent
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Closed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          const { toggleConversationPin } = useChatStore.getState();
                          toggleConversationPin(conversation.id);
                        }}>
                          {conversation.isPinned ? (
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
    </div>
  );
}
