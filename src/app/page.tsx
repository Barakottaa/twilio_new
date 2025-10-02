'use client';

import { useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from "@/components/layout/main-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import { MessageInput } from "@/components/chat/message-input";
import { useChatStore } from "@/store/chat-store";

// Lazy load heavy components for better initial bundle size
const OptimizedChatLayout = lazy(() => import("@/components/chat/optimized-chat-layout").then(module => ({ default: module.OptimizedChatLayout })));

export default function Home() {
  const { agent, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { selectedConversationId } = useChatStore();

  const handleSendMessage = async (text: string) => {
    if (!selectedConversationId || !agent) return;
    
    try {
      const response = await fetch(`/api/twilio/conversations/${selectedConversationId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text.trim(),
          author: agent.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

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

  // No need for complex initialization - the new optimized layout handles this automatically

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading application...</p>
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
          <OptimizedChatLayout loggedInAgent={agent} />
        </Suspense>
      </div>
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={!selectedConversationId}
        disabledReason={!selectedConversationId ? "Select a conversation to send messages" : undefined}
      />
    </MainLayout>
  );
}
