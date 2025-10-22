'use client';

import { useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from "@/components/layout/main-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";

// Lazy load heavy components for better initial bundle size
const OptimizedChatLayout = lazy(() => import("@/components/chat/optimized-chat-layout").then(module => ({ default: module.OptimizedChatLayout })));

export default function Home() {
  const { agent, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Add a small delay to ensure cookies are set after login
    const timer = setTimeout(() => {
      if (!authLoading && !isAuthenticated) {
        console.log('🔍 Redirecting to login - not authenticated');
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
    </MainLayout>
  );
}
