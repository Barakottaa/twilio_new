'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Circle, CircleDot, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { ConversationStatus } from '@/types';

export type StatusFilter = 'all' | 'open' | 'closed';

interface ConversationStatusPriorityFilterProps {
  statusFilter: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  counts: {
    status: {
      all: number;
      open: number;
      closed: number;
    };
  };
}

export function ConversationStatusPriorityFilter({
  statusFilter,
  onStatusChange,
  counts
}: ConversationStatusPriorityFilterProps) {
  const statusOptions = [
    {
      value: 'all' as StatusFilter,
      label: 'All Status',
      icon: Circle,
      color: 'text-gray-600'
    },
    {
      value: 'open' as StatusFilter,
      label: 'Open',
      icon: CircleDot,
      color: 'text-green-600'
    },
    {
      value: 'closed' as StatusFilter,
      label: 'Closed',
      icon: XCircle,
      color: 'text-red-600'
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
