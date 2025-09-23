import type { Chat } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}

export function ChatListItem({ chat, isSelected, onClick }: ChatListItemProps) {
  const lastMessage = chat.messages[chat.messages.length - 1];
  const customerName = chat.customer?.name || "Anonymous";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors w-full text-left",
        isSelected ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={chat.customer?.avatar} alt={customerName} data-ai-hint="person portrait" />
        <AvatarFallback>{customerName.substring(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 truncate">
        <p className="font-semibold">{customerName}</p>
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
