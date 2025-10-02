'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, UserCheck, UserX, Search, X } from 'lucide-react';
import { ConversationStatusPriorityFilter, type StatusFilter } from './conversation-status-priority-filter';

export type TabFilterType = 'all' | 'assigned' | 'unassigned';

interface ConversationTabFilterProps {
  activeTab: TabFilterType;
  onTabChange: (tab: TabFilterType) => void;
  onSearchChange: (searchQuery: string) => void;
  onStatusChange: (status: StatusFilter) => void;
  counts: {
    all: number;
    assigned: number;
    unassigned: number;
    status: {
      all: number;
      open: number;
      closed: number;
    };
  };
  currentAgentId?: string;
  statusFilter: StatusFilter;
}

export function ConversationTabFilter({ 
  activeTab, 
  onTabChange, 
  onSearchChange,
  onStatusChange,
  counts, 
  currentAgentId,
  statusFilter
}: ConversationTabFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearchChange('');
  };
  const tabs = [
    {
      id: 'all' as TabFilterType,
      label: 'All',
      icon: Users,
      count: counts.all,
      description: 'All conversations'
    },
    {
      id: 'assigned' as TabFilterType,
      label: 'Assigned to Me',
      icon: UserCheck,
      count: counts.assigned,
      description: `Conversations assigned to you`
    },
    {
      id: 'unassigned' as TabFilterType,
      label: 'Unassigned',
      icon: UserX,
      count: counts.unassigned,
      description: 'Conversations not assigned to any agent'
    }
  ];

  // Debug logging
  console.log('🔍 ConversationTabFilter render - activeTab:', activeTab, 'counts:', counts, 'searchQuery:', searchQuery);
  console.log('🔍 Tabs array:', tabs);

  return (
    <div className="border-b bg-white shadow-sm">
      {/* Search Bar */}
      <div className="p-3 border-b bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone number, or message..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10 bg-white border-gray-200"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Status Filter */}
      <ConversationStatusPriorityFilter
        statusFilter={statusFilter}
        onStatusChange={onStatusChange}
        counts={{
          status: counts.status
        }}
      />
      
      
      {/* Tab Filter */}
      <div className="flex bg-white min-h-[60px]">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isUnassigned = tab.id === 'unassigned';
          
          console.log(`🔍 Rendering tab: ${tab.id}, count: ${tab.count}, isActive: ${isActive}`);
          
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "ghost"}
              className={`
                flex-1 rounded-none border-0 transition-all duration-200 min-w-[120px]
                ${index === 0 ? 'border-l-0' : 'border-l border-gray-200'}
                ${isActive 
                  ? 'border-b-4 border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-sm' 
                  : isUnassigned
                    ? 'border-b-2 border-orange-300 hover:border-orange-400 hover:bg-orange-50 text-orange-600'
                    : 'border-b-2 border-transparent hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                }
                       h-16 px-3 py-3 text-sm font-medium relative
              `}
              onClick={() => {
                console.log(`🔍 Tab clicked: ${tab.id}`);
                onTabChange(tab.id);
              }}
              title={tab.description}
            >
              <div className="flex flex-col items-center gap-1 w-full">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isUnassigned ? 'text-orange-500' : ''}`} />
                  <span className="text-xs font-medium text-center leading-tight">{tab.label}</span>
                </div>
                <Badge 
                  variant={isActive ? "default" : "secondary"} 
                  className={`text-xs h-5 min-w-[20px] flex items-center justify-center font-bold ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : isUnassigned
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.count}
                </Badge>
              </div>
              {isUnassigned && tab.count > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
