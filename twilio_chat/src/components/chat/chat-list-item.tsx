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
            "group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 w-full text-left border border-transparent",
            isSelected 
              ? "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 shadow-md" 
              : "hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:border-muted-foreground/10 hover:shadow-sm"
          )}
        >
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-background transition-all duration-200 group-hover:ring-primary/30">
                {/* Temporarily disabled avatar image to force fallback */}
                {/* <AvatarImage src={chat.customer?.avatar} alt={customerName} data-ai-hint="person portrait" /> */}
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm">
                  {getInitials(customerName)}
                </AvatarFallback>
              </Avatar>
              {/* Online status indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
            </div>
          <div className="flex-1 truncate min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-base text-foreground truncate">{customerName}</h3>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <StatusBadge status={chat.status} />
                <PriorityBadge priority={chat.priority} />
              </div>
            </div>
            
            {/* Contact info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              {chat.customer.phoneNumber && (
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-full">
                  <Phone className="h-3 w-3 text-primary" />
                  <span className="font-medium">{chat.customer.phoneNumber}</span>
                </div>
              )}
              {chat.customer.email && (
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-full">
                  <Mail className="h-3 w-3 text-primary" />
                  <span className="truncate font-medium">{chat.customer.email}</span>
                </div>
              )}
            </div>
            
            {/* Agent info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-full">
                <User className="h-3 w-3 text-blue-600" />
                <span className="font-medium text-blue-700 dark:text-blue-300">{chat.agent.name}</span>
                <AgentStatus status={chat.agent.status} />
              </div>
            </div>
            
            <p className="text-muted-foreground truncate text-sm leading-relaxed font-medium">
              {lastMessage.text}
            </p>
            
            {/* Tags */}
            {chat.tags && chat.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {chat.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-2 py-1 bg-gradient-to-r from-secondary/50 to-secondary/30 border-0 font-medium">
                    {tag}
                  </Badge>
                ))}
                {chat.tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs px-2 py-1 bg-gradient-to-r from-secondary/50 to-secondary/30 border-0 font-medium">
                    +{chat.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground self-start min-w-0">
            <div className="flex items-center gap-1.5 bg-muted/20 px-2 py-1 rounded-full">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">
                {formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true })}
              </span>
            </div>
            {chat.unreadCount > 0 && (
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white h-6 w-6 p-0 flex items-center justify-center text-xs font-bold shadow-md">
                {chat.unreadCount}
              </Badge>
            )}
          </div>
        </button>
      );
    });
