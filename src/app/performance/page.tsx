'use client';

import { PerformanceDashboard } from '@/components/performance/performance-dashboard';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PerformancePage() {
  const { agent, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !agent) {
    return null;
  }

  return (
    <MainLayout loggedInAgent={agent}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Performance Metrics</h1>
          <p className="text-gray-600 mt-2">
            Real-time performance monitoring including TTFB, Core Web Vitals, and API metrics
          </p>
        </div>
        
        <PerformanceDashboard />
      </div>
    </MainLayout>
  );
}
