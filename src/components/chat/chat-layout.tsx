'use client';

import { useState } from 'react';
import type { Agent, Chat, Message } from '@/types';
import { ChatList } from './chat-list';
import { ChatView } from './chat-view';
import { useToast } from '@/hooks/use-toast';
import { sendTwilioMessage, reassignTwilioConversation } from '@/lib/twilio-service';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import { usePollingMessages } from '@/hooks/use-polling-messages';

// Helper function to ensure all chat objects are plain objects
function ensurePlainChat(chat: Chat): Chat {
  return {
    id: String(chat.id),
    customer: {
      id: chat.customer.id ? String(chat.customer.id) : null,
      name: String(chat.customer.name),
      avatar: String(chat.customer.avatar),
      phoneNumber: chat.customer.phoneNumber ? String(chat.customer.phoneNumber) : undefined,
      email: chat.customer.email ? String(chat.customer.email) : undefined,
      lastSeen: chat.customer.lastSeen ? String(chat.customer.lastSeen) : undefined,
    },
    agent: {
      id: String(chat.agent.id),
      name: String(chat.agent.name),
      avatar: String(chat.agent.avatar),
    },
    messages: chat.messages.map(msg => ({
      id: String(msg.id),
      text: String(msg.text),
      timestamp: String(msg.timestamp),
      sender: String(msg.sender),
      senderId: String(msg.senderId),
    })),
    unreadCount: Number(chat.unreadCount),
  };
}

interface ChatLayoutProps {
  chats: Chat[];
  agents: Agent[];
  loggedInAgent: Agent;
}

export function ChatLayout({ chats: initialChats, agents, loggedInAgent }: ChatLayoutProps) {
  // Ensure initial chats are plain objects
  const [chats, setChats] = useState<Chat[]>(initialChats.map(ensurePlainChat));
  const [selectedChat, setSelectedChat] = useState<Chat | null>(chats.length > 0 ? chats[0] : null);
  const { toast } = useToast();

  // Enable real-time messaging with SSE
  useRealtimeMessages({ chats, setChats, setSelectedChat });
  
  // Enable polling as fallback (disabled by default, can be enabled if SSE fails)
  usePollingMessages({ 
    chats, 
    setChats, 
    setSelectedChat, 
    loggedInAgentId: loggedInAgent.id,
    enabled: false // Set to true if SSE is not working
  });

  const handleSendMessage = async (chatId: string, text: string) => {
    try {
      console.log("Sending message:", { chatId, text, agentId: loggedInAgent.id });
      await sendTwilioMessage(chatId, loggedInAgent.id, text);
      console.log("Message sent successfully via Twilio");
      
      // Create a plain object message
      const newMessage: Message = {
        id: String(`msg-${Date.now()}`),
        text: String(text),
        timestamp: String(new Date().toISOString()),
        sender: 'agent' as const,
        senderId: String(loggedInAgent.id),
      };
  
      // Create updated chats with plain objects
      const updatedChats = chats.map((chat) => {
        if (chat.id === chatId) {
          const updatedChat = {
            ...chat,
            messages: [...chat.messages, newMessage],
          };
          return ensurePlainChat(updatedChat);
        }
        return ensurePlainChat(chat);
      });
  
      setChats(updatedChats);
      const updatedSelectedChat = updatedChats.find(chat => chat.id === chatId);
      if(updatedSelectedChat) {
          setSelectedChat(updatedSelectedChat);
      }
      
      // Show success message
      toast({
        title: "Message Sent",
        description: "Message sent successfully!",
      });
      
    } catch (error: any) {
       console.error("Error in handleSendMessage:", error);
       toast({
        title: "Error Sending Message",
        description: error.message || "Failed to send message via Twilio. Please check your credentials and network.",
        variant: "destructive",
      });
    }
  };

  const handleReassignAgent = async (chatId: string, newAgentId: string) => {
    const newAgent = agents.find((agent) => agent.id === newAgentId);
    if (!newAgent) return;

    try {
      await reassignTwilioConversation(chatId, newAgentId);
      
      const updatedChats = chats.map((chat) => {
        if (chat.id === chatId) {
          toast({
            title: "Chat Reassigned",
            description: `Conversation with ${chat.customer.name} has been reassigned to ${newAgent.name}.`,
          });
          const updatedChat = {
            ...chat,
            agent: newAgent,
          };
          return ensurePlainChat(updatedChat);
        }
        return ensurePlainChat(chat);
      });
  
      setChats(updatedChats);
      const updatedSelectedChat = updatedChats.find(chat => chat.id === chatId);
       if(updatedSelectedChat) {
          setSelectedChat(updatedSelectedChat);
      }
    } catch (error) {
      toast({
        title: "Error Reassigning Agent",
        description: "Failed to reassign agent in Twilio. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };


  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    // Mark chat as read
    const updatedChats = chats.map(c => 
      c.id === chat.id ? ensurePlainChat({ ...c, unreadCount: 0 }) : ensurePlainChat(c)
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
