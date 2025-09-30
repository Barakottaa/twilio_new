import dynamic from 'next/dynamic';

// Lazy load heavy components
export const SettingsPanel = dynamic(() => import('./settings/settings-panel'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
});

export const AnalyticsDashboard = dynamic(() => import('./analytics/analytics-dashboard'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
});

export const AgentManagement = dynamic(() => import('./agents/agent-management'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
});

export const PerformanceDashboard = dynamic(() => import('./performance/performance-dashboard'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
});
