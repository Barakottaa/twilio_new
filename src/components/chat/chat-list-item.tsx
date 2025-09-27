import type { Chat } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';
import { Phone, Mail } from 'lucide-react';

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

export function ChatListItem({ chat, isSelected, onClick }: ChatListItemProps) {
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
        <p className="font-semibold">{customerName}</p>
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
        <p className="text-muted-foreground truncate text-sm">
          {lastMessage.text}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground self-start">
        <span>
          {formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true })}
        </span>
        {chat.unreadCount > 0 && (
          <Badge className="bg-primary h-5 w-5 p-0 flex items-center justify-center text-xs">
            {chat.unreadCount}
          </Badge>
        )}
      </div>
    </button>
  );
}
