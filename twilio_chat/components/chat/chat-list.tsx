'use client';

import { useState, useMemo } from 'react';
import type { Agent, Chat } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VirtualScroll } from '@/components/ui/virtual-scroll';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatListItem } from './chat-list-item';
import { ConversationFilters } from './conversation-filters';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { RefreshCw } from 'lucide-react';
import { useChatStore } from '@/store/chat-store';

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onRefresh: () => void;
  loggedInAgent: Agent;
  agents: Agent[];
}

export function ChatList({ chats, selectedChat, onSelectChat, onRefresh, loggedInAgent, agents }: ChatListProps) {
  const [filteredChats, setFilteredChats] = useState<Chat[]>(chats);

  // Use virtual scrolling for large lists (more than 50 items)
  const shouldUseVirtualScroll = useMemo(() => filteredChats.length > 50, [filteredChats.length]);

  const renderChatItem = (chat: Chat, index: number) => (
    <div key={chat.id} className="p-1">
      <ChatListItem
        chat={chat}
        isSelected={selectedChat?.id === chat.id}
        onClick={() => onSelectChat(chat)}
      />
    </div>
  );

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
      
      <ConversationFilters 
        conversations={chats}
        onFilteredConversations={setFilteredChats}
        agents={agents}
        selectedNumberId={useChatStore(state => state.selectedNumberId)}
        onNumberSelect={useChatStore(state => state.setSelectedNumber)}
      />
      
      {shouldUseVirtualScroll ? (
        <VirtualScroll
          items={filteredChats}
          itemHeight={120} // Approximate height of each chat item
          containerHeight={600} // Fixed height for the chat list
          renderItem={renderChatItem}
          className="flex-1"
        />
      ) : (
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 p-2">
            {filteredChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isSelected={selectedChat?.id === chat.id}
                onClick={() => onSelectChat(chat)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
