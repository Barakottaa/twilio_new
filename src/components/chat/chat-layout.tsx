'use client';

import { useState } from 'react';
import type { Agent, Chat, Message } from '@/types';
import { ChatList } from './chat-list';
import { ChatView } from './chat-view';
import { useToast } from '@/hooks/use-toast';
import { sendTwilioMessage } from '@/lib/twilio-service';

interface ChatLayoutProps {
  chats: Chat[];
  agents: Agent[];
  loggedInAgent: Agent;
}

export function ChatLayout({ chats: initialChats, agents, loggedInAgent }: ChatLayoutProps) {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(chats.length > 0 ? chats[0] : null);
  const { toast } = useToast();

  const handleSendMessage = async (chatId: string, text: string) => {
    try {
      await sendTwilioMessage(chatId, loggedInAgent.id, text);
      
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
    } catch (error) {
       toast({
        title: "Error Sending Message",
        description: "Failed to send message via Twilio. Please check your credentials and network.",
        variant: "destructive",
      });
    }
  };

  const handleReassignAgent = (chatId: string, newAgentId: string) => {
    const newAgent = agents.find((agent) => agent.id === newAgentId);
    if (!newAgent) return;

    // In a real app, you would call a backend service to reassign the agent in Twilio.
    // For now, we just update the UI.
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
