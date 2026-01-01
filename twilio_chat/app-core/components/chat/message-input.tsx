'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, UserPlus, Loader2, FileText } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  disabledReason?: string;
  onAssignToMe?: () => void;
  showAssignButton?: boolean;
  isAssigning?: boolean;
  onSendTemplate?: () => void;
  showTemplateButton?: boolean;
}

export function MessageInput({ 
  onSendMessage, 
  disabled = false, 
  disabledReason, 
  onAssignToMe, 
  showAssignButton = false, 
  isAssigning = false,
  onSendTemplate,
  showTemplateButton = false
}: MessageInputProps) {
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-orange-800">{disabledReason}</p>
            {showAssignButton && onAssignToMe && (
              <div className="ml-2">
                {isAssigning ? (
                  // Skeleton loading animation that matches button size
                  <div className="inline-flex items-center px-3 py-1.5 border border-orange-300 rounded-md bg-orange-50">
                    <div className="h-4 w-4 bg-orange-300 rounded-full animate-spin mr-2"></div>
                    <div className="h-4 w-20 bg-orange-300 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <Button
                    onClick={onAssignToMe}
                    size="sm"
                    variant="outline"
                    className="text-orange-800 border-orange-300 hover:bg-orange-100"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Assign to Me
                  </Button>
                )}
              </div>
            )}
          </div>
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
        {showTemplateButton && onSendTemplate && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground"
            onClick={onSendTemplate}
            title="Send template message"
          >
            <FileText className="h-5 w-5" />
            <span className="sr-only">Send template</span>
          </Button>
        )}
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
