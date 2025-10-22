'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Loader2, Phone, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TwilioTemplate {
  sid: string;
  friendlyName: string;
  contentSid: string;
  language: string;
  dateCreated?: string;
  dateUpdated?: string;
  rawTemplate?: any;
}

interface NewConversationTemplateModalProps {
  searchQuery: string;
  onMessageSent?: () => void;
}

export function NewConversationTemplateModal({ 
  searchQuery, 
  onMessageSent 
}: NewConversationTemplateModalProps) {
  const [templates, setTemplates] = useState<TwilioTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Extract phone number from search query if it looks like one
  useEffect(() => {
    if (searchQuery.trim()) {
      // Check if search query looks like a phone number
      const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
      if (phoneRegex.test(searchQuery.replace(/\s/g, ''))) {
        setCustomerPhone(searchQuery.replace(/\s/g, ''));
        setCustomerName(''); // Let user enter name
      } else {
        // Assume it's a name
        setCustomerName(searchQuery);
        setCustomerPhone(''); // Let user enter phone
      }
    }
  }, [searchQuery]);

  // Fetch available templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/twilio/templates');
        if (response.ok) {
          const data = await response.json();
          console.log('📋 Template data received for new conversation:', data);
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

    fetchTemplates();
  }, []);

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !customerPhone || isSending) return;

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

      // Normalize phone number
      const normalizedPhone = customerPhone.startsWith('+') ? customerPhone : `+${customerPhone}`;

      console.log('🔍 Sending template to new conversation:', {
        customerPhone: normalizedPhone,
        customerName,
        selectedTemplate,
        template,
        contentSid: template.contentSid
      });

      const response = await fetch('/api/twilio/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: `new_${Date.now()}`, // Temporary ID for new conversations
          customerPhone: normalizedPhone,
          isTemplate: true,
          contentSid: template.contentSid,
          contentVariables: {
            '1': customerName || 'Customer' // Use provided name or default
          }
        }),
      });

      if (response.ok) {
        toast({ 
          title: "Success", 
          description: `Template message sent to ${normalizedPhone}!` 
        });
        
        // Reset form
        setSelectedTemplate('');
        setCustomerPhone('');
        setCustomerName('');
        
        if (onMessageSent) {
          onMessageSent();
        }
      } else {
        const errorData = await response.json();
        toast({ 
          title: "Error", 
          description: errorData.error || "Failed to send template message.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
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
    <Card className="m-4 border-dashed border-2 border-muted-foreground/25">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Start New Conversation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          No conversations found for "{searchQuery}". Send a template message to start a new conversation.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            💡 <strong>Tip:</strong> Template messages can be sent to any phone number, even if there's no existing conversation.
          </AlertDescription>
        </Alert>

        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription>
            ⚠️ <strong>Sandbox Mode:</strong> You can only send messages to phone numbers that have joined your WhatsApp Sandbox. If the message fails, the recipient needs to send your sandbox join code to your WhatsApp number first.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerPhone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              placeholder="+1234567890"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Name
            </Label>
            <Input
              id="customerName"
              type="text"
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Select Template</Label>
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

        <Button
          onClick={handleSendTemplate}
          disabled={!selectedTemplate || !customerPhone || isSending || isLoading}
          className="w-full"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send Template Message
        </Button>
      </CardContent>
    </Card>
  );
}
