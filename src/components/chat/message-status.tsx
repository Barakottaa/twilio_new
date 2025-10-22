'use client';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Clock, X } from 'lucide-react';

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';
  className?: string;
}

export function MessageStatus({ status, className }: MessageStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="h-4 w-4 text-white" />;
      case 'sent':
        return <Check className="h-4 w-4 text-white" />;
      case 'delivered':
        return <CheckCheck className="h-4 w-4 text-white" />;
      case 'read':
        return <CheckCheck className="h-4 w-4 text-blue-200" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-200" />;
      case 'undelivered':
        return <X className="h-4 w-4 text-orange-200" />;
      default:
        return <Check className="h-4 w-4 text-white" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'sending':
        return 'text-white';
      case 'sent':
        return 'text-white';
      case 'delivered':
        return 'text-white';
      case 'read':
        return 'text-blue-200';
      case 'failed':
        return 'text-red-200';
      case 'undelivered':
        return 'text-orange-200';
      default:
        return 'text-white';
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      {getStatusIcon()}
    </div>
  );
}
