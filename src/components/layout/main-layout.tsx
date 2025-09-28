'use client';

import { Sidebar } from '@/components/navigation/sidebar';
import type { Agent } from '@/types';

interface MainLayoutProps {
  children: React.ReactNode;
  loggedInAgent: Agent;
}

export function MainLayout({ children, loggedInAgent }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar loggedInAgent={loggedInAgent} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
