import { memo } from 'react';
import type { Chat } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';
import { StatusBadge } from '../ui/status-badge';
import { PriorityBadge } from '../ui/priority-badge';
import { AgentStatus } from '../ui/agent-status';
import { Phone, Mail, Clock, User } from 'lucide-react';

// Helper function to get initials from any name format
function getInitials(name: string): string {
  console.log('🔤 ChatListItem - Getting initials for name:', name);
  
  if (!name || name === "Anonymous") {
    console.log('🔤 ChatListItem - Returning AN for anonymous/empty name');
    return "AN";
  }
  
  // If it's a phone number format like "+20 15 5700 0970", extract numbers
  if (name.match(/^\+\d/)) {
    const numbers = name.replace(/\D/g, ''); // Remove all non-digits
    const result = numbers.slice(-2); // Take last 2 digits
    console.log('🔤 ChatListItem - Phone number detected, returning:', result);
    return result;
  }
  
  // For regular names, take first 2 characters
  const result = name.substring(0, 2).toUpperCase();
  console.log('🔤 ChatListItem - Regular name detected, returning:', result);
  return result;
}

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}

export const ChatListItem = memo(function ChatListItem({ chat, isSelected, onClick }: ChatListItemProps) {
  const lastMessage = chat.messages[chat.messages.length - 1];
  const customerName = chat.customer?.name || "Anonymous";
  
  console.log('👤 ChatListItem - customerName:', customerName);
  console.log('👤 ChatListItem - chat.customer:', chat.customer);

      return (
        <button
          onClick={onClick}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg transition-colors w-full text-left",
            isSelected ? "bg-accent" : "hover:bg-accent/50"
          )}
        >
            <Avatar className="h-10 w-10">
              {/* Temporarily disabled avatar image to force fallback */}
              {/* <AvatarImage src={chat.customer?.avatar} alt={customerName} data-ai-hint="person portrait" /> */}
              <AvatarFallback>{getInitials(customerName)}</AvatarFallback>
            </Avatar>
          <div className="flex-1 truncate">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold">{customerName}</p>
              <div className="flex items-center gap-1">
                <StatusBadge status={chat.status} />
                <PriorityBadge priority={chat.priority} />
              </div>
            </div>
            
            {/* Contact info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              {chat.customer.phoneNumber && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{chat.customer.phoneNumber}</span>
                </div>
              )}
              {chat.customer.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{chat.customer.email}</span>
                </div>
              )}
            </div>
            
            {/* Agent info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <User className="h-3 w-3" />
              <span>{chat.agent.name}</span>
              <AgentStatus status={chat.agent.status} />
            </div>
            
            <p className="text-muted-foreground truncate text-sm">
              {lastMessage.text}
            </p>
            
            {/* Tags */}
            {chat.tags && chat.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {chat.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                    {tag}
                  </Badge>
                ))}
                {chat.tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    +{chat.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground self-start">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true })}
              </span>
            </div>
            {chat.unreadCount > 0 && (
              <Badge className="bg-primary h-5 w-5 p-0 flex items-center justify-center text-xs">
                {chat.unreadCount}
              </Badge>
            )}
          </div>
        </button>
      );
    });
