import { cn } from '@/lib/utils';
import type { Agent } from '@/types';

interface AgentStatusProps {
  status: Agent['status'];
  className?: string;
  showLabel?: boolean;
}

const statusConfig = {
  online: {
    label: 'Online',
    className: 'bg-green-500',
  },
  offline: {
    label: 'Offline',
    className: 'bg-gray-400',
  },
  busy: {
    label: 'Busy',
    className: 'bg-orange-500',
  },
  away: {
    label: 'Away',
    className: 'bg-yellow-500',
  },
};

export function AgentStatus({ status, className, showLabel = false }: AgentStatusProps) {
  const config = statusConfig[status];
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('w-2 h-2 rounded-full', config.className)} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
}
