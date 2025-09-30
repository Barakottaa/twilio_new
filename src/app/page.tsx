'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from "@/components/layout/main-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { initializeConversations } from "@/lib/conversation-service";
import { assertSerializable } from "@/lib/assertSerializable";
import { toPlain } from "@/lib/toPlain";
import { useAuth } from "@/hooks/use-auth";
import type { Agent } from "@/types";

// Lazy load heavy components for better initial bundle size
const ChatLayout = lazy(() => import("@/components/chat/chat-layout").then(module => ({ default: module.ChatLayout })));
const PerformanceMonitor = lazy(() => import("@/components/performance-monitor").then(module => ({ default: module.PerformanceMonitor })));

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
          const response = await fetch(`/api/twilio/conversations?agentId=${agent.id}&limit=20`);
          const data = await response.json();
          
          if (data.success && data.conversations && data.conversations.length > 0) {
            // Initialize with real conversations
            initializeConversations(data.conversations);
            setChats(toPlain(data.conversations));
            console.log('Using real Twilio conversations:', data.conversations.length);
          } else {
            // No conversations found - start with empty state
            console.log('No real conversations found, starting with empty state');
            setChats([]);
          }
        } catch (error) {
          console.error('Error fetching Twilio conversations:', error);
          // Start with empty state on error
          setChats([]);
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
            console.error('Failed to fetch agents:', agentsResponse.status);
            setAgents([]);
          }
        } catch (error) {
          console.error('Error fetching agents:', error);
          setAgents([]);
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
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading application data...</p>
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
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="flex flex-col items-center space-y-2"><LoadingSpinner /><p className="text-sm text-gray-600">Loading chat interface...</p></div></div>}>
          <ChatLayout
            chats={chats}
            agents={agents}
            loggedInAgent={agent}
          />
        </Suspense>
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="flex flex-col items-center space-y-2"><LoadingSpinner /><p className="text-sm text-gray-600">Loading performance monitor...</p></div></div>}>
          <PerformanceMonitor enabled={process.env.NODE_ENV === 'development'} />
        </Suspense>
      </div>
    </MainLayout>
  );
}
