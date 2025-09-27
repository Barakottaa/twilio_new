'use client';

import type { Agent, Chat } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatListItem } from './chat-list-item';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { RefreshCw } from 'lucide-react';

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onRefresh: () => void;
  loggedInAgent: Agent;
}

export function ChatList({ chats, selectedChat, onSelectChat, onRefresh, loggedInAgent }: ChatListProps) {
  return (
    <div className="w-full max-w-xs border-r flex flex-col bg-card">
      <div className="p-4 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold font-headline text-primary">TwilioChat</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefresh}
            className="h-8 w-8"
            title="Refresh chats"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarImage src={loggedInAgent.avatar} alt={loggedInAgent.name} />
            <AvatarFallback>{loggedInAgent.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className="p-2">
        <Input placeholder="Search or start new chat" className="bg-background" />
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {chats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChat?.id === chat.id}
              onClick={() => onSelectChat(chat)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
