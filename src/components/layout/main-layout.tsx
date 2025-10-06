'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/navigation/sidebar';
import { ResourcePreloader } from '@/components/resource-preloader';
import { PageTransition } from '@/components/ui/page-transition';
import { notificationService } from '@/lib/notification-service';
import type { Agent } from '@/types';

interface MainLayoutProps {
  children: React.ReactNode;
  loggedInAgent: Agent;
}

export function MainLayout({ children, loggedInAgent }: MainLayoutProps) {
  useEffect(() => {
    // Request notification permission when the app loads
    const requestNotificationPermission = async () => {
      try {
        const hasPermission = await notificationService.requestPermission();
        if (hasPermission) {
          console.log('✅ Notification permission granted');
        } else {
          console.log('❌ Notification permission denied or not supported');
        }
      } catch (error) {
        console.error('❌ Error requesting notification permission:', error);
      }
    };

    requestNotificationPermission();
  }, []);

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
