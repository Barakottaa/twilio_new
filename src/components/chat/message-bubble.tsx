import type { Message } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface MessageBubbleProps {
  message: Message;
  avatarUrl: string;
  showAvatar: boolean;
}

export function MessageBubble({ message, avatarUrl, showAvatar }: MessageBubbleProps) {
  const isAgent = message.sender === 'agent';

  return (
    <div className={cn("flex items-end gap-2", isAgent ? "justify-end" : "justify-start")}>
      {!isAgent && showAvatar && (
        <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt="Avatar" />
            <AvatarFallback>C</AvatarFallback>
        </Avatar>
      )}
       {!isAgent && !showAvatar && (
        <div className="w-8" />
      )}
      <div
        className={cn(
          "rounded-lg px-3 py-2 max-w-md relative animate-in fade-in zoom-in-95",
          isAgent ? "bg-primary text-primary-foreground" : "bg-card shadow-sm",
        )}
      >
        <p className="text-sm break-words">{message.text}</p>
        <span className="text-xs text-right block mt-1 opacity-60">
          {format(new Date(message.timestamp), 'p')}
        </span>
      </div>
      {isAgent && !showAvatar && (
        <div className="w-8" />
      )}
      {isAgent && showAvatar && (
        <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt="Avatar" />
            <AvatarFallback>A</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
