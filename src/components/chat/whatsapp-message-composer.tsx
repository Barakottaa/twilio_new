'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppMessageComposerProps {
  conversationId: string;
  customerPhone: string;
  customerName: string;
  lastCustomerMessage?: string; // ISO timestamp of last customer message
  onMessageSent?: (message: any) => void;
  disabled?: boolean;
}

interface MessageWindowStatus {
  isInWindow: boolean;
  timeRemaining?: string;
  canSendFreeForm: boolean;
  canSendTemplate: boolean;
  lastMessageTime?: string;
}

export function WhatsAppMessageComposer({
  conversationId,
  customerPhone,
  customerName,
  lastCustomerMessage,
  onMessageSent,
  disabled = false
}: WhatsAppMessageComposerProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [windowStatus, setWindowStatus] = useState<MessageWindowStatus>({
    isInWindow: false,
    canSendFreeForm: false,
    canSendTemplate: true
  });
  const { toast } = useToast();

  // Check message window status
  useEffect(() => {
    const checkWindowStatus = () => {
      console.log('🕐 Checking window status for:', customerName, 'lastCustomerMessage:', lastCustomerMessage);
      
      if (!lastCustomerMessage) {
        console.log('❌ No last customer message found');
        setWindowStatus({
          isInWindow: false,
          canSendFreeForm: false,
          canSendTemplate: true,
          lastMessageTime: undefined
        });
        return;
      }

      const lastMessageTime = new Date(lastCustomerMessage);
      const now = new Date();
      const timeDiff = now.getTime() - lastMessageTime.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      const isInWindow = hoursDiff <= 24;
      
      console.log('⏰ Time calculation:', {
        lastMessageTime: lastMessageTime.toISOString(),
        now: now.toISOString(),
        timeDiff: timeDiff,
        hoursDiff: hoursDiff,
        isInWindow: isInWindow
      });

      let timeRemaining = '';
      if (isInWindow) {
        const remainingHours = 24 - hoursDiff;
        const remainingMinutes = Math.floor((remainingHours % 1) * 60);
        timeRemaining = `${Math.floor(remainingHours)}h ${remainingMinutes}m`;
      }

      setWindowStatus({
        isInWindow,
        timeRemaining,
        canSendFreeForm: isInWindow,
        canSendTemplate: true, // Templates can always be sent
        lastMessageTime: lastCustomerMessage
      });
    };

    checkWindowStatus();
    // Update every minute
    const interval = setInterval(checkWindowStatus, 60000);
    return () => clearInterval(interval);
  }, [lastCustomerMessage]);

  const handleSendMessage = async (messageText: string, isTemplate: boolean = false) => {
    if (!messageText.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/twilio/conversations/${conversationId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText.trim(),
          author: 'admin' // Default author for regular messages
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage('');
        
        toast({
          title: "Message Sent",
          description: `Message sent to ${customerName}`,
        });

        if (onMessageSent) {
          onMessageSent(result.message);
        }
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Send",
          description: error.error || "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendFreeForm = () => {
    if (windowStatus.canSendFreeForm) {
      handleSendMessage(message, false);
    }
  };

  const handleSendTemplate = () => {
    handleSendMessage(message, true);
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Send Message to {customerName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Window Status Alert */}
        {lastCustomerMessage ? (
          <Alert className={windowStatus.isInWindow ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
            <div className="flex items-center gap-2">
              {windowStatus.isInWindow ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-orange-600" />
              )}
              <AlertDescription className="text-sm">
                {windowStatus.isInWindow ? (
                  <span className="text-green-800">
                    ✅ In messaging window - {windowStatus.timeRemaining} remaining
                  </span>
                ) : (
                  <span className="text-orange-800">
                    ⚠️ Outside messaging window - Only template messages allowed
                  </span>
                )}
                <br />
                <span className="text-xs text-muted-foreground">
                  Last customer message: {formatLastMessageTime(lastCustomerMessage)}
                </span>
              </AlertDescription>
            </div>
          </Alert>
        ) : (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              No previous customer messages - Only template messages allowed
            </AlertDescription>
          </Alert>
        )}

        {/* Message Input */}
        <div className="space-y-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              windowStatus.canSendFreeForm 
                ? "Type your message..." 
                : "Type a template message (only templates allowed outside 24h window)..."
            }
            rows={3}
            disabled={disabled || isSending}
            className="resize-none"
          />
          
          {/* Character count */}
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{message.length} characters</span>
            <span>Phone: {customerPhone}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {windowStatus.canSendFreeForm && (
            <Button
              onClick={handleSendFreeForm}
              disabled={!message.trim() || isSending || disabled}
              className="flex-1"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Free Message
            </Button>
          )}
          
          <Button
            onClick={handleSendTemplate}
            disabled={!message.trim() || isSending || disabled}
            variant={windowStatus.canSendFreeForm ? "outline" : "default"}
            className="flex-1"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4 mr-2" />
            )}
            Send as Template
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Free Messages:</strong> Can be sent within 24 hours of customer's last message
          </p>
          <p>
            <strong>Template Messages:</strong> Can be sent anytime but must be pre-approved by WhatsApp
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
