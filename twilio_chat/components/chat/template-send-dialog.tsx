'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/store/chat-store';

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

interface TemplateSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  customerPhone: string;
  customerName: string;
  onTemplateSent?: () => void;
}

export function TemplateSendDialog({
  open,
  onOpenChange,
  conversationId,
  customerPhone,
  customerName,
  onTemplateSent
}: TemplateSendDialogProps) {
  const [templates, setTemplates] = useState<TwilioTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const selectedNumberId = useChatStore(state => state.selectedNumberId);

  // Fetch available templates when dialog opens
  useEffect(() => {
    if (open) {
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
            toast({
              title: "Error",
              description: "Failed to load templates",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error fetching templates:', error);
          toast({
            title: "Error",
            description: "An error occurred while loading templates",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchTemplates();
    } else {
      // Reset state when dialog closes
      setSelectedTemplate('');
    }
  }, [open, toast]);

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
          fromNumberId: selectedNumberId,
          conversationId: conversationId,
          customerPhone: customerPhone,
          isTemplate: true,
          contentSid: template.contentSid,
          contentVariables: {
            '1': customerName
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
        onOpenChange(false);
        if (onTemplateSent) {
          onTemplateSent();
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
      console.error('Error sending template:', error);
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred.", 
        variant: "destructive" 
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Template Message</DialogTitle>
          <DialogDescription>
            Choose a template to send to {customerName || customerPhone}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Template</label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
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

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTemplate}
              disabled={!selectedTemplate || isSending || isLoading}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Template
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

