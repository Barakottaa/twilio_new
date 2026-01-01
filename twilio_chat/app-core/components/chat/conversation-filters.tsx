'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { ConversationStatus, Chat } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { Search, Filter, X, Users, Clock, Tag, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ConversationFiltersProps {
  conversations: Chat[];
  onFilteredConversations: (filtered: Chat[]) => void;
  agents: Array<{ id: string; name: string; status: string }>;
  selectedNumberId?: string | null;
  onNumberSelect?: (numberId: string | null) => void;
}

export function ConversationFilters({ conversations, onFilteredConversations, agents, selectedNumberId, onNumberSelect }: ConversationFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Chat['priority'] | 'all'>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [numbers, setNumbers] = useState<Array<{ id: string; number: string; name: string; department: string }>>([]);

  // Fetch available numbers
  useEffect(() => {
    const fetchNumbers = async () => {
      try {
        const response = await fetch('/api/twilio/numbers');
        if (response.ok) {
          const data = await response.json();
          setNumbers(data.numbers || []);
          console.log('✅ Numbers loaded:', data.numbers?.length || 0);
        } else {
          console.error('❌ Failed to fetch numbers:', response.status);
        }
      } catch (error) {
        console.error('❌ Error fetching numbers:', error);
        // Set empty array on error so selector still shows
        setNumbers([]);
      }
    };
    fetchNumbers();
  }, []);

  // Get all unique tags from conversations (memoized)
  const allTags = useMemo(() => 
    Array.from(new Set(conversations.flatMap(conv => conv.tags || []))), 
    [conversations]
  );

  // Apply filters (memoized)
  const applyFilters = useCallback(() => {
    let filtered = [...conversations];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv =>
        conv.customer.name.toLowerCase().includes(query) ||
        conv.customer.email?.toLowerCase().includes(query) ||
        conv.customer.phoneNumber?.includes(query) ||
        conv.agent.name.toLowerCase().includes(query) ||
        conv.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        conv.notes?.toLowerCase().includes(query) ||
        conv.messages.some(msg => msg.text.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(conv => conv.priority === priorityFilter);
    }

    // Agent filter
    if (agentFilter !== 'all') {
      filtered = filtered.filter(conv => conv.agent.id === agentFilter);
    }

    // Tag filter
    if (tagFilter !== 'all') {
      filtered = filtered.filter(conv => conv.tags?.includes(tagFilter));
    }

    // Number filter (if selectedNumberId is provided, filter by it)
    if (selectedNumberId) {
      filtered = filtered.filter(conv => conv.twilioNumberId === selectedNumberId);
    }

    onFilteredConversations(filtered);
  }, [searchQuery, statusFilter, priorityFilter, agentFilter, tagFilter, selectedNumberId, conversations, onFilteredConversations]);

  // Clear all filters (memoized)
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAgentFilter('all');
    setTagFilter('all');
    if (onNumberSelect) {
      onNumberSelect(null);
    }
    onFilteredConversations(conversations);
  }, [conversations, onFilteredConversations, onNumberSelect]);

  // Apply filters when any filter changes
  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const activeFiltersCount = [
    searchQuery.trim() ? 1 : 0,
    statusFilter !== 'all' ? 1 : 0,
    priorityFilter !== 'all' ? 1 : 0,
    agentFilter !== 'all' ? 1 : 0,
    tagFilter !== 'all' ? 1 : 0,
    selectedNumberId ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className="p-4 border-b bg-card space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations, customers, agents, tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Number Filter - Always visible and prominently placed */}
        <Select 
          value={selectedNumberId || 'all'} 
          onValueChange={(value) => {
            if (onNumberSelect) {
              onNumberSelect(value === 'all' ? null : value);
            }
          }}
        >
          <SelectTrigger className="w-48">
            <Phone className="h-4 w-4 mr-2" />
            <SelectValue placeholder={numbers.length > 0 ? "All Numbers" : "Loading numbers..."} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Numbers</SelectItem>
            {numbers.length > 0 ? (
              numbers.map((number) => (
                <SelectItem key={number.id} value={number.id}>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{number.name}</span>
                    <span className="text-xs text-muted-foreground">({number.number})</span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="loading" disabled>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>Loading numbers...</span>
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value: ConversationStatus | 'all') => setStatusFilter(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select value={priorityFilter} onValueChange={(value: Chat['priority'] | 'all') => setPriorityFilter(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        {/* Agent Filter */}
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                <div className="flex items-center gap-2">
                  <span>{agent.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {agent.status}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    <span>{tag}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}


        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1">
            <X className="h-3 w-3" />
            Clear ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {searchQuery.trim() && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <StatusBadge status={statusFilter} />
              <button onClick={() => setStatusFilter('all')} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {priorityFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <PriorityBadge priority={priorityFilter} />
              <button onClick={() => setPriorityFilter('all')} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {agentFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {agents.find(a => a.id === agentFilter)?.name}
              <button onClick={() => setAgentFilter('all')} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {tagFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {tagFilter}
              <button onClick={() => setTagFilter('all')} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedNumberId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {numbers.find(n => n.id === selectedNumberId)?.name || selectedNumberId}
              <button onClick={() => onNumberSelect && onNumberSelect(null)} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
