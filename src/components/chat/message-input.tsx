'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function MessageInput({ onSendMessage, disabled = false, disabledReason }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    console.log('🔍 MessageInput handleSend called:', { text, disabled });
    if (text.trim() && !disabled) {
      console.log('🔍 Calling onSendMessage with:', text.trim());
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !disabled) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t bg-card">
      {disabled && disabledReason && (
        <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
          <p className="text-sm text-orange-800">{disabledReason}</p>
        </div>
      )}
      <div className="flex items-center gap-2">
         <Button 
           variant="ghost" 
           size="icon" 
           className="text-muted-foreground hover:text-foreground"
           disabled={disabled}
         >
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach file</span>
        </Button>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Cannot send messages to unassigned chat" : "Type a message..."}
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-background border-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button 
          onClick={handleSend}
          disabled={!text.trim() || disabled} 
          size="icon"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}
