'use client';

import { useState, useEffect } from 'react';
import { useChatStore } from '@/store/chat-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDistanceToNow } from 'date-fns';
import { 
  Phone, 
  Mail, 
  User, 
  MoreVertical, 
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';

interface ConversationItem {
  id: string;
  title: string;
  lastMessagePreview: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  agentId: string;
}

interface OptimizedChatListProps {
  agentId?: string;
}

export function OptimizedChatList({ agentId }: OptimizedChatListProps) {
  const { 
    conversations, 
    selectedConversationId, 
    setSelectedConversation,
    isLoading,
    error 
  } = useChatStore();
  
  const [localConversations, setLocalConversations] = useState<ConversationItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
            setLocalConversations(prev => [...prev, ...data.items]);
          } else {
            setLocalConversations(data.items);
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
          setLocalConversations(prev => [...prev, ...convertedItems]);
        } else {
          setLocalConversations(convertedItems);
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

  if ((isLoading || isInitialLoad) && localConversations.length === 0) {
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
      <div className="flex-1 overflow-y-auto">
        {localConversations.map((conversation) => (
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
                    {conversation.status && <StatusBadge status={conversation.status} />}
                    {conversation.priority && <PriorityBadge priority={conversation.priority} />}
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
                        <DropdownMenuItem>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Change Priority
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
                
                {/* Agent info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <User className="h-3 w-3" />
                  <span>{conversation.agentName || 'Unassigned'}</span>
                  {conversation.agentStatus && (
                    <Badge variant="outline" className="text-xs">
                      {conversation.agentStatus}
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground truncate mb-1">
                  {conversation.lastMessagePreview || 'No messages yet'}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {conversation.updatedAt ? formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true }) : 'Just now'}
                  </span>
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
        
        {hasMore && localConversations.length > 0 && (
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
