import { cn } from '@/lib/utils';
import { Badge } from './badge';
import type { Chat } from '@/types';

interface PriorityBadgeProps {
  priority: Chat['priority'];
  className?: string;
}

const priorityConfig = {
  normal: {
    label: 'Normal',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  },
  low: {
    label: 'Low',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  },
  medium: {
    label: 'Medium',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-800 hover:bg-red-200',
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority || 'normal'];
  
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
