import { cn } from '@/lib/utils';
import { Badge } from './badge';
import type { ConversationStatus } from '@/types';

interface StatusBadgeProps {
  status: ConversationStatus;
  className?: string;
}

const statusConfig = {
  open: {
    label: 'Open',
    className: 'bg-green-100 text-green-800 hover:bg-green-200',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  },
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  },
  escalated: {
    label: 'Escalated',
    className: 'bg-red-100 text-red-800 hover:bg-red-200',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
