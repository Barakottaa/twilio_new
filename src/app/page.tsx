'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatLayout } from "@/components/chat/chat-layout";
import { MainLayout } from "@/components/layout/main-layout";
import { PerformanceMonitor } from "@/components/performance-monitor";
import { availableAgents as mockAgents, chats as mockChats } from "@/lib/mock-data";
import { getTwilioConversations } from "@/lib/twilio-service";
import { initializeConversations } from "@/lib/conversation-service";
import { assertSerializable } from "@/lib/assertSerializable";
import { toPlain } from "@/lib/toPlain";
import { useAuth } from "@/hooks/use-auth";
import type { Agent } from "@/types";

export default function Home() {
  const { agent, isLoading: authLoading, isAuthenticated } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Add a small delay to ensure cookies are set after login
    const timer = setTimeout(() => {
      if (!authLoading && !isAuthenticated) {
        router.push('/login');
        return;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !agent) return;

    const initializeApp = async () => {
      try {
        // Fetch real Twilio conversations
        try {
          const conversations = await getTwilioConversations();
          if (conversations && conversations.length > 0) {
            // Initialize with real conversations
            initializeConversations(conversations);
            setChats(toPlain(conversations));
            console.log('Using real Twilio conversations:', conversations.length);
          } else {
            // Fallback to mock data if no real conversations
            console.log('No real conversations found, using mock data');
            initializeConversations(mockChats);
            setChats(toPlain(mockChats));
          }
        } catch (error) {
          console.error('Error fetching Twilio conversations:', error);
          // Fallback to mock data
          initializeConversations(mockChats);
          setChats(toPlain(mockChats));
        }

        // Fetch real agents
        try {
          const agentsResponse = await fetch('/api/agents', {
            credentials: 'include'
          });
          if (agentsResponse.ok) {
            const agentsData = await agentsResponse.json();
            setAgents(agentsData);
            console.log('Using real agents:', agentsData.length);
          } else {
            // Fallback to mock agents
            console.log('Using mock agents');
            const serializedAgents = toPlain(mockAgents.map(agent => ({
              id: String(agent.id),
              name: String(agent.name),
              avatar: String(agent.avatar),
              email: agent.email ? String(agent.email) : undefined,
              status: String(agent.status),
              maxConcurrentChats: Number(agent.maxConcurrentChats),
              currentChats: Number(agent.currentChats),
              skills: agent.skills ? agent.skills.map(String) : undefined,
              department: agent.department ? String(agent.department) : undefined,
              lastActive: agent.lastActive ? String(agent.lastActive) : undefined,
            })));
            setAgents(serializedAgents as Agent[]);
          }
        } catch (error) {
          console.error('Error fetching agents:', error);
          // Fallback to mock agents
          const serializedAgents = toPlain(mockAgents.map(agent => ({
            id: String(agent.id),
            name: String(agent.name),
            avatar: String(agent.avatar),
            email: agent.email ? String(agent.email) : undefined,
            status: String(agent.status),
            maxConcurrentChats: Number(agent.maxConcurrentChats),
            currentChats: Number(agent.currentChats),
            skills: agent.skills ? agent.skills.map(String) : undefined,
            department: agent.department ? String(agent.department) : undefined,
            lastActive: agent.lastActive ? String(agent.lastActive) : undefined,
          })));
          setAgents(serializedAgents as Agent[]);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    initializeApp();
  }, [authLoading, isAuthenticated, agent, router]);

  if (authLoading || isDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !agent) {
    return null; // Will redirect to login
  }

  return (
    <MainLayout loggedInAgent={agent}>
      <div className="h-full">
        <ChatLayout
          chats={chats}
          agents={agents}
          loggedInAgent={agent}
        />
        <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />
      </div>
    </MainLayout>
  );
}
