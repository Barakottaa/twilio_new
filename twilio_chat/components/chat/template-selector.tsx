'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Clock, AlertTriangle, Loader2 } from 'lucide-react';
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
        if (response.ok) {
          const data = await response.json();
          console.log('📋 Template data received:', data);
          setTemplates(data.templates || []);
        } else {
          console.error('Failed to fetch templates');
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOutsideWindow) {
      fetchTemplates();
    }
  }, [isOutsideWindow]);

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
    <div className="flex-shrink-0 border-t bg-muted/30 p-2">
      <Card>
        <CardHeader className="pb-1.5 pt-2">
          <CardTitle className="flex items-center gap-2 text-orange-600 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            {lastCustomerMessage ? 'Template Message Required' : 'Send Template Message'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 py-2">
          <Alert variant={lastCustomerMessage ? "destructive" : "default"} className="p-2 py-1.5 [&>svg]:left-2 [&>svg]:top-2 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg~*]:pl-5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <div>
              <p className="font-medium text-xs leading-tight">
                {lastCustomerMessage 
                  ? "Outside 24-hour messaging window. Only approved templates can be sent."
                  : "This is a new conversation. Send a template message to start the conversation."}
              </p>
              {lastCustomerMessage && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  Last customer message: {new Date(lastCustomerMessage).toLocaleString()}
                </p>
              )}
            </div>
          </Alert>

          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium">Select Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={isLoading ? "Loading templates..." : "Choose a template"} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.sid} value={template.sid}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{template.friendlyName}</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✓ Business
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {template.language}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  
                  {/* Show message if no templates */}
                  {templates.length === 0 && !isLoading && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No WhatsApp business-initiated templates found. 
                      <br />
                      <span className="text-xs">Only approved business-initiated templates are shown.</span>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendTemplate}
              disabled={!selectedTemplate || isSending || isLoading}
              className="w-full text-xs h-8"
            >
              {isSending ? (
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              ) : (
                <Send className="h-3 w-3 mr-2" />
              )}
              Send Template Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}