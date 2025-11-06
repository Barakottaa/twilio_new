'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, UserX, Search, X, Phone } from 'lucide-react';
import { ConversationStatusPriorityFilter, type StatusFilter } from './conversation-status-priority-filter';

/**
 * Type for conversation tab filters
 */
export type TabFilterType = 'all' | 'assigned' | 'unassigned';

/**
 * Props for ConversationTabFilter component
 */
interface ConversationTabFilterProps {
  activeTab: TabFilterType;
  onTabChange: (tab: TabFilterType) => void;
  onSearchChange: (searchQuery: string) => void;
  onStatusChange: (status: StatusFilter) => void;
  counts: {
    status: {
      all: number;
      open: number;
      closed: number;
    };
  };
  statusFilter: StatusFilter;
  selectedNumberId?: string | null;
  onNumberSelect?: (numberId: string | null) => void;
  conversations?: Array<{ id: string; status?: 'open' | 'closed' | 'pending'; twilioNumberId?: string }>;
  isLoading?: boolean;
}

/**
 * ConversationTabFilter Component
 * 
 * Provides filtering and navigation controls for conversations:
 * - Phone number selector with open conversation count indicators
 * - Search bar for filtering conversations
 * - Status filter (open/closed)
 * - Tab filter (all/assigned/unassigned)
 * 
 * @param props - Component props
 */
export function ConversationTabFilter({ 
  activeTab, 
  onTabChange, 
  onSearchChange,
  onStatusChange,
  counts, 
  statusFilter,
  selectedNumberId,
  onNumberSelect,
  conversations = [],
  isLoading = false
}: ConversationTabFilterProps) {
  // Local state for search query
  const [searchQuery, setSearchQuery] = useState('');
  // Available phone numbers from Twilio
  const [numbers, setNumbers] = useState<Array<{ id: string; number: string; name: string; department: string }>>([]);

  /**
   * Calculate the number of open conversations per phone number
   * Used to display count badges in the number selector
   */
  const openConversationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    conversations.forEach(conv => {
      if (conv.status === 'open' && conv.twilioNumberId) {
        counts.set(conv.twilioNumberId, (counts.get(conv.twilioNumberId) || 0) + 1);
      }
    });
    return counts;
  }, [conversations]);

  /**
   * Fetch available phone numbers from Twilio API
   * Runs once on component mount
   */
  useEffect(() => {
    const fetchNumbers = async () => {
      try {
        const response = await fetch('/api/twilio/numbers');
        if (response.ok) {
          const data = await response.json();
          // Deduplicate numbers by id to avoid duplicates in dropdown
          const uniqueNumbers = Array.isArray(data.numbers)
            ? data.numbers.reduce((acc: typeof data.numbers, num: any) => {
                if (!acc.find((n: any) => n.id === num.id)) acc.push(num);
                return acc;
              }, [])
            : [];
          setNumbers(uniqueNumbers);
        } else {
          console.error('Failed to fetch numbers:', response.status);
        }
      } catch (error) {
        console.error('Error fetching numbers:', error);
        setNumbers([]);
      }
    };
    fetchNumbers();
  }, []);

  /**
   * Handle search input changes
   * Updates local state and notifies parent component
   */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  /**
   * Clear search query
   */
  const clearSearch = () => {
    setSearchQuery('');
    onSearchChange('');
  };

  /**
   * Tab configuration for conversation filtering
   */
  const tabs = [
    {
      id: 'all' as TabFilterType,
      label: 'All',
      icon: Users,
      description: 'All conversations'
    },
    {
      id: 'assigned' as TabFilterType,
      label: 'Assigned to Me',
      icon: UserCheck,
      description: `Conversations assigned to you`
    },
    {
      id: 'unassigned' as TabFilterType,
      label: 'Unassigned',
      icon: UserX,
      description: 'Conversations not assigned to any agent'
    }
  ];

  return (
    <div className="border-b bg-white shadow-sm">
      {/* Number Selector and Search Bar */}
      <div className="p-3 border-b bg-gray-50 space-y-2">
        {/* Number Selector - Required */}
        {onNumberSelect && numbers.length > 0 && (
          <Select 
            value={selectedNumberId || numbers[0]?.id || ''} 
            onValueChange={(value) => {
              onNumberSelect(value);
            }}
            disabled={isLoading}
          >
            <SelectTrigger className={`w-full ${!isLoading && openConversationCounts.has(selectedNumberId || '') ? 'border-orange-300 bg-orange-50/50' : ''}`}>
              <Phone className="h-4 w-4 mr-2" />
              {isLoading ? (
                <div className="flex items-center gap-2 flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <SelectValue placeholder="Select Number" />
              )}
              {!isLoading && selectedNumberId && openConversationCounts.has(selectedNumberId) && (
                <span className="ml-auto flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                </span>
              )}
            </SelectTrigger>
            <SelectContent>
              {numbers.map((number) => {
                const openCount = !isLoading ? (openConversationCounts.get(number.id) || 0) : 0;
                const hasOpenConversations = !isLoading && openCount > 0;
                return (
                  <SelectItem key={number.id} value={number.id}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span className={hasOpenConversations ? "font-semibold" : ""}>{number.name}</span>
                        <span className="text-xs text-muted-foreground">({number.number})</span>
                      </div>
                      {hasOpenConversations && (
                        <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                          {openCount} open
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
        
        {/* Search Bar */}
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
              onClick={() => onTabChange(tab.id)}
              title={tab.description}
            >
              <div className="flex items-center gap-2 w-full justify-center">
                <Icon className={`h-4 w-4 ${isUnassigned ? 'text-orange-500' : ''}`} />
                <span className="text-xs font-medium text-center leading-tight">{tab.label}</span>
              </div>
              {/* Show notification dot for unassigned conversations */}
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
