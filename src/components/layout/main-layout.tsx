'use client';

import { Sidebar } from '@/components/navigation/sidebar';
import { ResourcePreloader } from '@/components/resource-preloader';
import { PageTransition } from '@/components/ui/page-transition';
import type { Agent } from '@/types';

interface MainLayoutProps {
  children: React.ReactNode;
  loggedInAgent: Agent;
}

export function MainLayout({ children, loggedInAgent }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ResourcePreloader />
      <Sidebar loggedInAgent={loggedInAgent} />
      <main className="flex-1 overflow-hidden relative">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
