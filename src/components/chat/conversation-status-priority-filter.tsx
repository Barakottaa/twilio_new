'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Circle, CircleDot, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { ConversationStatus } from '@/types';

export type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
export type StatusFilter = 'all' | 'open' | 'closed';

interface ConversationStatusPriorityFilterProps {
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  onStatusChange: (status: StatusFilter) => void;
  onPriorityChange: (priority: PriorityFilter) => void;
  counts: {
    status: {
      all: number;
      open: number;
      closed: number;
    };
    priority: {
      all: number;
      high: number;
      medium: number;
      low: number;
    };
  };
}

export function ConversationStatusPriorityFilter({
  statusFilter,
  priorityFilter,
  onStatusChange,
  onPriorityChange,
  counts
}: ConversationStatusPriorityFilterProps) {
  const statusOptions = [
    {
      value: 'all' as StatusFilter,
      label: 'All Status',
      icon: Circle,
      count: counts.status.all,
      color: 'text-gray-600'
    },
    {
      value: 'open' as StatusFilter,
      label: 'Open',
      icon: CircleDot,
      count: counts.status.open,
      color: 'text-green-600'
    },
    {
      value: 'closed' as StatusFilter,
      label: 'Closed',
      icon: XCircle,
      count: counts.status.closed,
      color: 'text-red-600'
    }
  ];

  const priorityOptions = [
    {
      value: 'all' as PriorityFilter,
      label: 'All Priority',
      icon: Circle,
      count: counts.priority.all,
      color: 'text-gray-600'
    },
    {
      value: 'high' as PriorityFilter,
      label: 'High',
      icon: AlertTriangle,
      count: counts.priority.high,
      color: 'text-red-600'
    },
    {
      value: 'medium' as PriorityFilter,
      label: 'Medium',
      icon: Clock,
      count: counts.priority.medium,
      color: 'text-yellow-600'
    },
    {
      value: 'low' as PriorityFilter,
      label: 'Low',
      icon: CheckCircle,
      count: counts.priority.low,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="p-3 bg-gray-50 border-b">
      <div className="space-y-3">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Status Filter
          </label>
          <div className="flex gap-1">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isActive = statusFilter === option.value;
              
              return (
                <Button
                  key={option.value}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`
                    flex-1 h-8 px-2 text-xs font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }
                  `}
                  onClick={() => onStatusChange(option.value)}
                >
                  <div className="flex items-center gap-1">
                    <Icon className={`h-3 w-3 ${isActive ? 'text-white' : option.color}`} />
                    <span className="text-xs">{option.label}</span>
                    <Badge 
                      variant="secondary"
                      className={`
                        ml-1 text-xs h-4 min-w-[16px] flex items-center justify-center font-bold
                        ${isActive 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700'
                        }
                      `}
                    >
                      {option.count}
                    </Badge>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Priority Filter
          </label>
          <div className="flex gap-1">
            {priorityOptions.map((option) => {
              const Icon = option.icon;
              const isActive = priorityFilter === option.value;
              
              return (
                <Button
                  key={option.value}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`
                    flex-1 h-8 px-2 text-xs font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-orange-600 text-white shadow-sm' 
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }
                  `}
                  onClick={() => onPriorityChange(option.value)}
                >
                  <div className="flex items-center gap-1">
                    <Icon className={`h-3 w-3 ${isActive ? 'text-white' : option.color}`} />
                    <span className="text-xs">{option.label}</span>
                    <Badge 
                      variant="secondary"
                      className={`
                        ml-1 text-xs h-4 min-w-[16px] flex items-center justify-center font-bold
                        ${isActive 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-200 text-gray-700'
                        }
                      `}
                    >
                      {option.count}
                    </Badge>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
