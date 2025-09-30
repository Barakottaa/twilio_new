'use client';

import { useState, lazy, Suspense } from 'react';
import type { Agent, Chat, Message } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { reassignTwilioConversation, getTwilioConversations } from '@/lib/twilio-service';
import { useRealtimeMessages } from '@/hooks/use-realtime-messages';
import { usePollingMessages } from '@/hooks/use-polling-messages';
// import { useTwilioConversations } from '@/hooks/use-twilio-conversations';

// Lazy load chat components for better performance
const ChatList = lazy(() => import('./chat-list').then(module => ({ default: module.ChatList })));
const ChatView = lazy(() => import('./chat-view').then(module => ({ default: module.ChatView })));

// Helper function to ensure all chat objects are plain objects
function ensurePlainChat(chat: Chat): Chat {
  return {
    id: String(chat.id),
    customer: {
      id: chat.customer.id ? String(chat.customer.id) : '',
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
      email: chat.agent.email ? String(chat.agent.email) : undefined,
      status: chat.agent.status as 'online' | 'offline' | 'busy' | 'away',
      maxConcurrentChats: Number(chat.agent.maxConcurrentChats),
      currentChats: Number(chat.agent.currentChats),
      skills: chat.agent.skills ? chat.agent.skills.map(String) : undefined,
      department: chat.agent.department ? String(chat.agent.department) : undefined,
      lastActive: chat.agent.lastActive ? String(chat.agent.lastActive) : undefined,
    },
    messages: chat.messages.map(msg => ({
      id: String(msg.id),
      text: String(msg.text),
      timestamp: String(msg.timestamp),
      sender: msg.sender as 'agent' | 'customer',
      senderId: String(msg.senderId),
    })),
    unreadCount: Number(chat.unreadCount),
    status: chat.status as 'open' | 'closed' | 'pending' | 'resolved' | 'escalated',
    priority: chat.priority as 'low' | 'medium' | 'high' | 'urgent',
    tags: chat.tags ? chat.tags.map(String) : undefined,
    createdAt: String(chat.createdAt),
    updatedAt: String(chat.updatedAt),
    assignedAt: chat.assignedAt ? String(chat.assignedAt) : undefined,
    closedAt: chat.closedAt ? String(chat.closedAt) : undefined,
    closedBy: chat.closedBy ? String(chat.closedBy) : undefined,
    notes: chat.notes ? String(chat.notes) : undefined,
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

  // Disable Twilio SDK - it's causing conflicts
  // const { isConnected: twilioConnected, error: twilioError } = useTwilioConversations({ 
  //   chats, 
  //   setChats, 
  //   setSelectedChat, 
  //   loggedInAgentId: loggedInAgent.id 
  // });
  
  // Use SSE as primary real-time system (webhooks → SSE → UI)
  useRealtimeMessages({ chats, setChats, setSelectedChat, loggedInAgentId: loggedInAgent.id });
  
  // Disable polling - webhooks + SSE are sufficient and much faster
  usePollingMessages({ 
    chats, 
    setChats, 
    setSelectedChat, 
    selectedChat,
    loggedInAgentId: loggedInAgent.id,
    enabled: false // Disabled - webhooks are instant, polling is slow
  });

  const handleSendMessage = async (chatId: string, text: string) => {
    try {
      console.log("Sending message:", { chatId, text, agentId: loggedInAgent.id });
      
      const response = await fetch(`/api/twilio/conversations/${chatId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          author: loggedInAgent.id
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }
      
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

      const handleUpdateChat = (updatedChat: Chat) => {
        const updatedChats = chats.map((chat) => {
          if (chat.id === updatedChat.id) {
            return ensurePlainChat(updatedChat);
          }
          return ensurePlainChat(chat);
        });
        
        setChats(updatedChats);
        
        if (selectedChat && selectedChat.id === updatedChat.id) {
          setSelectedChat(ensurePlainChat(updatedChat));
        }
      };


  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    // Mark chat as read
    const updatedChats = chats.map(c => 
      c.id === chat.id ? ensurePlainChat({ ...c, unreadCount: 0 }) : ensurePlainChat(c)
    );
    setChats(updatedChats);
  };

  const handleRefreshChats = async () => {
    try {
      console.log('🔄 Manually refreshing chats...');
      const freshChats = await getTwilioConversations(loggedInAgent.id);
      const updatedChats = freshChats.map(ensurePlainChat);
      setChats(updatedChats);
      
      // Update selected chat if it exists
      if (selectedChat) {
        const updatedSelectedChat = updatedChats.find(chat => chat.id === selectedChat.id);
        if (updatedSelectedChat) {
          setSelectedChat(updatedSelectedChat);
        }
      }
      
      toast({
        title: "Chats Refreshed",
        description: "Chat list updated successfully!",
      });
    } catch (error: any) {
      console.error('❌ Error refreshing chats:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh chats. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="z-10 h-full w-full max-w-7xl flex text-sm xl:rounded-lg border bg-card shadow-lg">
      {/* Connection Status Indicator - Disabled Twilio SDK */}
      {/* {twilioError && (
        <div className="absolute top-2 right-2 z-20 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs">
          ⚠️ {twilioError}
        </div>
      )}
      {twilioConnected && (
        <div className="absolute top-2 right-2 z-20 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">
          🟢 Real-time connected
        </div>
      )} */}
      
      <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="flex flex-col items-center space-y-2"><LoadingSpinner /><p className="text-sm text-gray-600">Loading chat list...</p></div></div>}>
        <ChatList
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={handleSelectChat}
          onRefresh={handleRefreshChats}
          loggedInAgent={loggedInAgent}
          agents={agents}
        />
      </Suspense>
      <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="flex flex-col items-center space-y-2"><LoadingSpinner /><p className="text-sm text-gray-600">Loading chat view...</p></div></div>}>
        <ChatView
          chat={selectedChat}
          agents={agents}
          loggedInAgent={loggedInAgent}
          onSendMessage={handleSendMessage}
          onReassignAgent={handleReassignAgent}
          onUpdateChat={handleUpdateChat}
        />
      </Suspense>
    </div>
  );
}
