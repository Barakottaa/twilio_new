'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, RefreshCw, User, MessageSquare, UserPlus, Lock, Unlock, AlertCircle } from 'lucide-react';
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
  // Additional information for enhanced display
  customerPhone?: string;
  customerEmail?: string;
  agentName?: string;
  agentStatus?: string;
  status?: 'open' | 'closed' | 'pending';
  priority?: 'low' | 'medium' | 'high';
}

interface OptimizedChatHeaderProps {
  conversation?: ConversationItem;
  onRefresh?: () => void;
  onAssignAgent?: (conversationId: string) => void;
  onToggleStatus?: (conversationId: string, newStatus: 'open' | 'closed' | 'pending') => void;
  onChangePriority?: (conversationId: string, newPriority: 'low' | 'medium' | 'high') => void;
}

export function OptimizedChatHeader({ 
  conversation, 
  onRefresh, 
  onAssignAgent, 
  onToggleStatus, 
  onChangePriority 
}: OptimizedChatHeaderProps) {
  if (!conversation) {
    return (
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
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
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{conversation.title}</h3>
              {conversation.status && (
                <StatusBadge status={conversation.status} />
              )}
              {conversation.priority && (
                <PriorityBadge priority={conversation.priority} />
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {conversation.customerPhone && (
                <span>📞 {conversation.customerPhone}</span>
              )}
              {conversation.agentName && conversation.agentName !== 'Unassigned' && (
                <span>👤 {conversation.agentName}</span>
              )}
              {conversation.agentName === 'Unassigned' && (
                <span className="text-orange-600">⚠️ Unassigned</span>
              )}
            </div>
            
            {conversation.lastMessagePreview && (
              <p className="text-xs text-gray-500 truncate max-w-xs mt-1">
                {conversation.lastMessagePreview}
              </p>
            )}
          </div>
          
          {conversation.unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onAssignAgent && (
                <DropdownMenuItem onClick={() => onAssignAgent(conversation.id)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Agent
                </DropdownMenuItem>
              )}
              
              {onToggleStatus && (
                <>
                  {conversation.status === 'open' ? (
                    <DropdownMenuItem onClick={() => onToggleStatus(conversation.id, 'closed')}>
                      <Lock className="h-4 w-4 mr-2" />
                      Close Conversation
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onToggleStatus(conversation.id, 'open')}>
                      <Unlock className="h-4 w-4 mr-2" />
                      Reopen Conversation
                    </DropdownMenuItem>
                  )}
                </>
              )}
              
              {onChangePriority && (
                <DropdownMenuItem onClick={() => onChangePriority(conversation.id, 'high')}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Set High Priority
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                View Contact Details
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Clear Chat History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
