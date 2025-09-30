'use client';

import { Sidebar } from '@/components/navigation/sidebar';
import { ResourcePreloader } from '@/components/resource-preloader';
import { PerformanceWidget } from '@/components/performance/performance-widget';
import { PageTransition } from '@/components/ui/page-transition';
import type { Agent } from '@/types';

interface MainLayoutProps {
  children: React.ReactNode;
  loggedInAgent: Agent;
}

export function MainLayout({ children, loggedInAgent }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <ResourcePreloader />
      <Sidebar loggedInAgent={loggedInAgent} />
      <main className="flex-1 overflow-auto relative">
        {/* Performance Widget - Fixed position in top right */}
        <div className="fixed top-4 right-4 z-50">
          <PerformanceWidget compact={true} />
        </div>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
