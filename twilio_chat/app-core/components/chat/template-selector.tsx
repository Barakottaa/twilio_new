'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Clock, AlertTriangle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChatStore } from '@/store/chat-store';
import { MessageInput } from './message-input';

interface TemplateSelectorProps {
  conversationId: string;
  customerPhone: string;
  customerName: string;
  lastCustomerMessage?: string;
  onMessageSent?: (message: any) => void;
  showRegularInput?: boolean;
  regularInputProps?: {
    onSendMessage: (text: string) => void;
    disabled?: boolean;
    disabledReason?: string;
    onAssignToMe?: () => void;
    showAssignButton?: boolean;
    isAssigning?: boolean;
  };
}

interface TwilioTemplate {
  sid: string;
  friendlyName: string;
  language: string;
  status: string;
  category: string;
  contentSid: string;
  dateCreated?: string;
  dateUpdated?: string;
  rawTemplate?: any;
}

export function TemplateSelector({
  conversationId,
  customerPhone,
  customerName,
  lastCustomerMessage,
  onMessageSent,
  showRegularInput = false,
  regularInputProps
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TwilioTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();
  const selectedNumberId = useChatStore(state => state.selectedNumberId);

  // Check if we're outside the 24-hour window
  const isOutsideWindow = useMemo(() => {
    if (!lastCustomerMessage) return true;

    const lastMessageTime = new Date(lastCustomerMessage);
    const now = new Date();
    const timeDiff = now.getTime() - lastMessageTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    return hoursDiff > 24;
  }, [lastCustomerMessage]);

  // Fetch available templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/twilio/templates');
        const data = await response.json();

        if (response.ok && data.success) {
          console.log('📋 Template data received:', data);
          setTemplates(data.templates || []);
        } else {
          const errorMessage = data.error || 'Failed to fetch templates';
          console.error('Failed to fetch templates:', errorMessage);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          setTemplates([]);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An error occurred while loading templates",
          variant: "destructive",
        });
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOutsideWindow) {
      fetchTemplates();
    }
  }, [isOutsideWindow, toast]);

  const handleSendTemplate = async () => {
    if (!selectedTemplate || isSending) return;

    setIsSending(true);
    try {
      // Look for template in available templates
      const template = templates.find(t => t.sid === selectedTemplate);

      if (!template) {
        toast({
          title: "Error",
          description: "Selected template not found",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/twilio/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromNumberId: selectedNumberId, // Pass selected number ID
          conversationId: conversationId,
          customerPhone: customerPhone,
          isTemplate: true,
          contentSid: template.contentSid,
          contentVariables: {
            '1': customerName // Example variable, adjust as needed
          }
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Template message response:', responseData);
        toast({
          title: "Success",
          description: `Template message sent! Status: ${responseData.status || 'sent'}`
        });
        setSelectedTemplate('');
        if (onMessageSent) {
          onMessageSent(template);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Template message error:', errorData);
        const errorMessage = errorData.error || "Failed to send template message.";
        const errorCode = errorData.errorCode ? ` (Error: ${errorData.errorCode})` : '';
        toast({
          title: "Error",
          description: `${errorMessage}${errorCode}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  // Template selector should ONLY show when outside 24-hour window
  // If inside window, this component should not be rendered (regular message input should be shown instead)
  if (!isOutsideWindow) {
    return null;
  }

  return (
    <div className="flex-shrink-0 border-t bg-muted/30 px-2 py-1">
      <Card className="border-0 shadow-none">
        <CardContent className="space-y-1 py-1 px-2 pt-2">
          <Alert variant="default" className="p-1.5 py-1 bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-200">
            <div className="flex gap-1.5 items-center justify-center">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <AlertDescription className="text-sm font-medium leading-tight">
                Wait for customer to send a message
              </AlertDescription>
            </div>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}