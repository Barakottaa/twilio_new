'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TemplateSelectorProps {
  conversationId: string;
  customerPhone: string;
  customerName: string;
  lastCustomerMessage?: string;
  onMessageSent?: (message: any) => void;
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
  onMessageSent
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TwilioTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

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
        toast({ title: "Success", description: "Template message sent successfully!" });
        setSelectedTemplate('');
        if (onMessageSent) {
          onMessageSent(template);
        }
      } else {
        const errorData = await response.json();
        toast({ title: "Error", description: errorData.error || "Failed to send template message.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOutsideWindow) {
    return null; // Don't render if within 24-hour window
  }

  return (
    <div className="flex-shrink-0 border-t bg-muted/30 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Template Message Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <div className="ml-2">
              <p className="font-medium">Outside 24-hour messaging window. Only approved templates can be sent.</p>
              {lastCustomerMessage && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-4 h-4" />
                  Last customer message: {new Date(lastCustomerMessage).toLocaleString()}
                </p>
              )}
            </div>
          </Alert>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Select Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading templates..." : "Choose a template"} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.sid} value={template.sid}>
                      <div className="flex flex-col">
                        <span className="font-medium">{template.friendlyName}</span>
                        <span className="text-xs text-muted-foreground">
                          {template.language}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  
                  {/* Show message if no templates */}
                  {templates.length === 0 && !isLoading && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No templates found. Create one in Twilio Console.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSendTemplate}
              disabled={!selectedTemplate || isSending || isLoading}
              className="w-full"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Template Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}