'use client';

import { useState } from 'react';
import type { Agent, Chat, Message } from '@/types';
import { ChatList } from './chat-list';
import { ChatView } from './chat-view';
import { useToast } from '@/hooks/use-toast';

interface ChatLayoutProps {
  chats: Chat[];
  agents: Agent[];
  loggedInAgent: Agent;
}

export function ChatLayout({ chats: initialChats, agents, loggedInAgent }: ChatLayoutProps) {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(chats.length > 0 ? chats[0] : null);
  const { toast } = useToast();

  const handleSendMessage = (chatId: string, text: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text,
      timestamp: new Date().toISOString(),
      sender: 'agent',
      senderId: loggedInAgent.id,
    };

    const updatedChats = chats.map((chat) => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
        };
      }
      return chat;
    });

    setChats(updatedChats);
    const updatedSelectedChat = updatedChats.find(chat => chat.id === chatId);
    if(updatedSelectedChat) {
        setSelectedChat(updatedSelectedChat);
    }
  };

  const handleReassignAgent = (chatId: string, newAgentId: string) => {
    const newAgent = agents.find((agent) => agent.id === newAgentId);
    if (!newAgent) return;

    const updatedChats = chats.map((chat) => {
      if (chat.id === chatId) {
        toast({
          title: "Chat Reassigned",
          description: `Conversation with ${chat.customer.name} has been reassigned to ${newAgent.name}.`,
        });
        return {
          ...chat,
          agent: newAgent,
        };
      }
      return chat;
    });

    setChats(updatedChats);
    const updatedSelectedChat = updatedChats.find(chat => chat.id === chatId);
     if(updatedSelectedChat) {
        setSelectedChat(updatedSelectedChat);
    }
  };


  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    // Mark chat as read
    const updatedChats = chats.map(c => 
      c.id === chat.id ? { ...c, unreadCount: 0 } : c
    );
    setChats(updatedChats);
  }

  return (
    <div className="z-10 h-full w-full max-w-7xl flex text-sm xl:rounded-lg border bg-card shadow-lg">
      <ChatList
        chats={chats}
        selectedChat={selectedChat}
        onSelectChat={handleSelectChat}
        loggedInAgent={loggedInAgent}
      />
      <ChatView
        chat={selectedChat}
        agents={agents}
        loggedInAgent={loggedInAgent}
        onSendMessage={handleSendMessage}
        onReassignAgent={handleReassignAgent}
      />
    </div>
  );
}
