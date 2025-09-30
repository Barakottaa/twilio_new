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
import { MoreVertical, RefreshCw, User, MessageSquare } from 'lucide-react';

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

interface OptimizedChatHeaderProps {
  conversation?: ConversationItem;
  onRefresh?: () => void;
}

export function OptimizedChatHeader({ conversation, onRefresh }: OptimizedChatHeaderProps) {
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
          
          <div>
            <h3 className="font-semibold text-sm">{conversation.title}</h3>
            <p className="text-xs text-gray-500 truncate max-w-xs">
              {conversation.lastMessagePreview || 'No messages yet'}
            </p>
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                View Contact
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Clear Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
