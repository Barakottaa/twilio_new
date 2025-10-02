'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, UserCheck, UserX, Search, X } from 'lucide-react';

export type TabFilterType = 'all' | 'assigned' | 'unassigned';

interface ConversationTabFilterProps {
  activeTab: TabFilterType;
  onTabChange: (tab: TabFilterType) => void;
  onSearchChange: (searchQuery: string) => void;
  counts: {
    all: number;
    assigned: number;
    unassigned: number;
  };
  currentAgentId?: string;
}

export function ConversationTabFilter({ 
  activeTab, 
  onTabChange, 
  onSearchChange,
  counts, 
  currentAgentId 
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
      
      {/* Tab Filter Header */}
      <div className="px-3 py-2 bg-gray-50 border-b">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Filter Conversations</h3>
      </div>
      
      {/* Tab Filter */}
      <div className="flex bg-white">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "ghost"}
              className={`
                flex-1 rounded-none border-0 border-b-3 transition-all duration-200
                ${isActive 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-sm' 
                  : 'border-transparent hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                }
                h-14 px-4 py-3 text-sm font-medium
              `}
              onClick={() => onTabChange(tab.id)}
              title={tab.description}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-sm">{tab.label}</span>
                {tab.count > 0 && (
                  <Badge 
                    variant={isActive ? "default" : "secondary"} 
                    className={`ml-1 text-xs h-6 min-w-[24px] flex items-center justify-center font-semibold ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {tab.count}
                  </Badge>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
