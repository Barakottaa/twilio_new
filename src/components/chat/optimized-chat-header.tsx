'use client';

import { useState } from 'react';
import { useChatStore } from '@/store/chat-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, RefreshCw, User, MessageSquare, UserPlus, Lock, Unlock, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { ContactDialog } from './contact-dialog';

interface ConversationItem {
  id: string;
  title: string;
  lastMessagePreview: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  agentId: string;
  // Additional information for enhanced display
  customerPhone?: string;
  customerEmail?: string;
  agentName?: string;
  agentStatus?: string;
  status?: 'open' | 'closed' | 'pending';
  priority?: 'low' | 'medium' | 'high';
}

interface OptimizedChatHeaderProps {
  conversationId?: string;            // NEW
  conversation?: ConversationItem;    // still supported
  onRefresh?: () => void;
  onAssignAgent?: (conversationId: string) => void;
  onToggleStatus?: (conversationId: string, newStatus: 'open' | 'closed' | 'pending') => void;
  onChangePriority?: (conversationId: string, newPriority: 'low' | 'medium' | 'high') => void;
}

export function OptimizedChatHeader({ 
  conversationId,
  conversation, 
  onRefresh, 
  onAssignAgent, 
  onToggleStatus, 
  onChangePriority 
}: OptimizedChatHeaderProps) {
  const [showContactDialog, setShowContactDialog] = useState(false);
  
  // Pull fallbacks from the store if props are missing
  const convFromStore = useChatStore(s => 
    conversationId ? s.conversations.find(c => c.id === conversationId) ?? null : null
  );
  const assigned = useChatStore(s => (conversationId ? s.assignments[conversationId] ?? null : null));
  const statusFromStore = useChatStore(s => (conversationId ? s.statuses[conversationId] ?? 'open' : 'open'));

  // Compose a safe "view model" with fallbacks
  const id = conversation?.id ?? conversationId ?? convFromStore?.id ?? '';
  const title = (conversation?.title ?? convFromStore?.title ?? 'Unknown Contact').trim();
  const status = (conversation?.status ?? statusFromStore ?? 'open') as 'open'|'closed'|'pending';
  const priority = conversation?.priority ?? convFromStore?.priority;
  const agentName = conversation?.agentName ?? assigned?.name ?? 'Unassigned';
  const customerPhone = conversation?.customerPhone ?? convFromStore?.customerPhone;
  const customerEmail = conversation?.customerEmail ?? convFromStore?.customerEmail;
  const lastMessagePreview = conversation?.lastMessagePreview ?? convFromStore?.lastMessagePreview ?? '';
  const unreadCount = conversation?.unreadCount ?? convFromStore?.unreadCount ?? 0;

  // If we still have no id and no store data, show skeleton
  const hasAnyData = id || title !== 'Unknown Contact';
  console.log('🔍 OptimizedChatHeader - conversation:', conversation);
  console.log('🔍 OptimizedChatHeader - conversation type:', typeof conversation);
  console.log('🔍 OptimizedChatHeader - conversation keys:', conversation ? Object.keys(conversation) : 'null');
  
  if (!hasAnyData) {
    return (
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(title || 'U')}&background=random`}
              alt={title}
              width={40}
              height={40}
            />
            <AvatarFallback>
              {(title || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{title}</h3>
              {status && (
                <StatusBadge status={status} />
              )}
              {priority && (
                <PriorityBadge priority={priority} />
              )}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {customerPhone && (
                <span>📞 {customerPhone}</span>
              )}
              {agentName && agentName !== 'Unassigned' && (
                <span>👤 {agentName}</span>
              )}
              {agentName === 'Unassigned' && (
                <span className="text-orange-600">⚠️ Unassigned</span>
              )}
            </div>
            
            {lastMessagePreview && (
              <p className="text-xs text-gray-500 truncate max-w-xs mt-1">
                {lastMessagePreview}
              </p>
            )}
          </div>
          
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onAssignAgent && (
                <DropdownMenuItem onClick={() => onAssignAgent(id)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Agent
                </DropdownMenuItem>
              )}
              
              {onToggleStatus && (
                <>
                  {status === 'open' ? (
                    <DropdownMenuItem onClick={() => onToggleStatus(id, 'closed')}>
                      <Lock className="h-4 w-4 mr-2" />
                      Close Conversation
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onToggleStatus(id, 'open')}>
                      <Unlock className="h-4 w-4 mr-2" />
                      Reopen Conversation
                    </DropdownMenuItem>
                  )}
                </>
              )}
              
              {onChangePriority && (
                <DropdownMenuItem onClick={() => onChangePriority(id, 'high')}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Set High Priority
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => setShowContactDialog(true)}>
                <User className="h-4 w-4 mr-2" />
                View Contact Details
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Clear Chat History
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Contact Dialog */}
      {showContactDialog && (
        <ContactDialog
          open={showContactDialog}
          onOpenChange={setShowContactDialog}
          chat={{
            id: id,
            customer: {
              id: id,
              name: title,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=random`,
              phoneNumber: customerPhone,
              email: customerEmail || '',
              lastSeen: new Date().toISOString()
            },
            agent: {
              id: assigned?.id || 'unassigned',
              username: assigned?.name || 'Unassigned',
              name: assigned?.name || 'Unassigned',
              avatar: '',
              role: 'agent' as const,
              status: 'offline' as const,
              permissions: {
                dashboard: true,
                agents: false,
                contacts: true,
                analytics: true,
                settings: false
              }
            },
            messages: [],
            unreadCount: unreadCount,
            status: status,
            priority: priority || 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: ''
          }}
        />
      )}
    </div>
  );
}
