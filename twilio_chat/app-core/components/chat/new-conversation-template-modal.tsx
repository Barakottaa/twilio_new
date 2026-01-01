'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Loader2, Phone, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/store/chat-store';

/**
 * Twilio Content Template structure
 */
interface TwilioTemplate {
  sid: string;
  friendlyName: string;
  contentSid: string;
  language: string;
  dateCreated?: string;
  dateUpdated?: string;
  rawTemplate?: any;
}

/**
 * Props for NewConversationTemplateModal component
 */
interface NewConversationTemplateModalProps {
  searchQuery: string;
  onMessageSent?: () => void;
}

/**
 * NewConversationTemplateModal Component
 * 
 * Modal for sending template messages to start new conversations.
 * Features:
 * - Phone number input (synced with search query)
 * - Template selection with preview
 * - Automatic conversation creation and navigation
 * - Contact name resolution from Twilio participants
 * 
 * @param props - Component props
 */
export function NewConversationTemplateModal({ 
  searchQuery, 
  onMessageSent 
}: NewConversationTemplateModalProps) {
  const [templates, setTemplates] = useState<TwilioTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const selectedNumberId = useChatStore(state => state.selectedNumberId);
  const { setSelectedConversation } = useChatStore();

  /**
   * Sync phone number input with search query
   * Keeps the phone number field in sync with the search input
   */
  useEffect(() => {
    if (searchQuery) {
      setCustomerPhone(searchQuery);
    }
  }, [searchQuery]);

  /**
   * Fetch available WhatsApp business templates from Twilio
   * Runs once on component mount
   */
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/twilio/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  /**
   * Handles sending template message to start new conversation
   * - Normalizes phone number
   * - Sends template via API
   * - Creates/finds conversation
   * - Resolves contact name from Twilio participants
   * - Navigates to new conversation
   * - Manually adds message to store for immediate display
   */
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

      // Normalize phone number using proper utility function
      const { normalizePhoneNumber } = await import('@/lib/utils');
      const normalizedPhone = normalizePhoneNumber(customerPhone);

      const response = await fetch('/api/twilio/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: `new_${Date.now()}`, // Temporary ID for new conversations
          customerPhone: normalizedPhone,
          fromNumberId: selectedNumberId, // Use the selected number from dropdown
          isTemplate: true,
          contentSid: template.contentSid,
          contentVariables: {
            '1': 'Customer' // Default customer name
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({ 
          title: "Success", 
          description: `Template message sent to ${normalizedPhone}!` 
        });
        
        // Reset form
        setSelectedTemplate('');
        
        // Get the conversation SID from the API response if available
        const conversationSid = result.conversationSid;
        
        if (conversationSid) {
          // Fetch conversation details to get contact name
          // Try multiple sources: conversation title, customer name, participant attributes
          let contactName = `Contact ${normalizedPhone}`;
          try {
            // Fetch full conversation details to get participant info
            const convDetailResponse = await fetch(`/api/twilio/conversations?conversationId=${conversationSid}&lite=0`);
            if (convDetailResponse.ok) {
              const convData = await convDetailResponse.json();
              if (convData.conversations && convData.conversations.length > 0) {
                const conv = convData.conversations[0];
                // Try multiple sources for the name
                contactName = conv.title || conv.customerName || conv.customer?.name || contactName;
              }
            }
            
            // If still no name, try to get it from Twilio participants directly
            // Check participant attributes for display_name
            if (contactName === `Contact ${normalizedPhone}`) {
              try {
                const { getTwilioClient } = await import('@/lib/twilio-service');
                const twilioClient = await getTwilioClient();
                const participants = await twilioClient.conversations.v1
                  .conversations(conversationSid)
                  .participants.list();
                
                const customerParticipant = participants.find(p => 
                  p.messagingBinding?.address === `whatsapp:${normalizedPhone}` ||
                  (!p.identity || (!p.identity.startsWith('agent') && !p.identity.startsWith('admin')))
                );
                
                if (customerParticipant) {
                  // Try to get display_name from attributes
                  if (customerParticipant.attributes) {
                    try {
                      const attrs = JSON.parse(customerParticipant.attributes);
                      if (attrs.display_name) {
                        contactName = attrs.display_name;
                      }
                    } catch (e) {
                      // Failed to parse attributes, continue with fallback
                    }
                  }
                  
                  // If still no name, format phone number (remove + prefix)
                  if (contactName === `Contact ${normalizedPhone}`) {
                    contactName = normalizedPhone.replace(/^\+/, '');
                  }
                }
              } catch (error) {
                console.error('Error fetching participants:', error);
              }
            }
          } catch (error) {
            console.error('Error fetching conversation details:', error);
          }
          
          // Add conversation to store if not already there
          // Use the formatted phone (without +) as the name for better display
          const displayName = contactName === `Contact ${normalizedPhone}` 
            ? normalizedPhone.replace(/^\+/, '') 
            : contactName;
          
          const store = useChatStore.getState();
          const existingConv = store.conversations.find(c => c.id === conversationSid);
          if (!existingConv) {
            // Add to conversations list
            const newConversation = {
              id: conversationSid,
              title: displayName,
              lastMessagePreview: 'Template message sent',
              unreadCount: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              customerId: normalizedPhone,
              agentId: 'unassigned',
              status: 'open' as const,
              customerPhone: normalizedPhone
            };
            store.setConversations([newConversation, ...store.conversations]);
          } else {
            // Update existing conversation with new title if current title is generic
            if (existingConv.title !== displayName && existingConv.title.startsWith('Contact +')) {
              store.setConversations(store.conversations.map(c => 
                c.id === conversationSid ? { ...c, title: displayName } : c
              ));
            }
          }
          
          // Manually add the template message to the store so it appears immediately
          // This ensures the message is visible before the sync completes
          const templateMessage = {
            id: result.messageId || result.messageSid || `msg_${Date.now()}`,
            text: result.body || 'Template message sent',
            timestamp: result.timestamp || new Date().toISOString(),
            sender: 'agent' as const,
            senderId: 'admin_001',
            deliveryStatus: 'sent' as const,
            twilioMessageSid: result.messageSid
          };
          
          const { appendMessage } = useChatStore.getState();
          const currentMessages = useChatStore.getState().messages[conversationSid] || [];
          
          // Check if message already exists (from SSE or previous load)
          const messageExists = currentMessages.some(m => 
            m.twilioMessageSid === result.messageSid || 
            m.id === templateMessage.id ||
            (m.text === templateMessage.text && m.sender === 'agent')
          );
          
          if (!messageExists) {
            appendMessage(conversationSid, templateMessage);
          }
          
          // Navigate immediately to the conversation
          setSelectedConversation(conversationSid);
          
          // Refresh conversations list to ensure it appears in the list with correct name
          if (onMessageSent) {
            onMessageSent();
          }
          
          // Trigger message sync after a short delay to ensure the template message appears
          // The useMessages hook will automatically load messages when conversation is selected
          setTimeout(async () => {
            try {
              const syncResponse = await fetch('/api/sync-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: conversationSid })
              });
              if (!syncResponse.ok) {
                console.error('Failed to sync messages');
              }
            } catch (error) {
              console.error('Error syncing messages:', error);
            }
          }, 500);
        } else {
          // Fallback: Find conversation by phone number if not in response
          // Refresh conversations list first
          if (onMessageSent) {
            onMessageSent();
          }
          
          /**
           * Attempts to find conversation by phone number with retries
           * Uses exponential backoff for retry attempts
           */
          const findAndNavigateToConversation = async (retryCount = 0): Promise<boolean> => {
            try {
              // Use the correct API endpoint to find conversation by phone
              const findResponse = await fetch(`/api/twilio/conversations/find-by-phone?phone=${encodeURIComponent(normalizedPhone)}&limit=1`);
              if (findResponse.ok) {
                const findData = await findResponse.json();
                
                if (findData.success && findData.items && findData.items.length > 0) {
                  const foundConversationSid = findData.items[0].id;
                  
                  // Add conversation to store if not already there
                  const store = useChatStore.getState();
                  const existingConv = store.conversations.find(c => c.id === foundConversationSid);
                  if (!existingConv) {
                    const newConversation = {
                      id: foundConversationSid,
                      title: `Contact ${normalizedPhone}`,
                      lastMessagePreview: 'Template message sent',
                      unreadCount: 0,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      customerId: normalizedPhone,
                      agentId: 'unassigned',
                      status: 'open' as const,
                      customerPhone: normalizedPhone
                    };
                    store.setConversations([newConversation, ...store.conversations]);
                  }
                  
                  // Navigate immediately to the conversation
                  setSelectedConversation(foundConversationSid);
                  return true;
                }
              }
            } catch (error) {
              console.error('Error finding conversation:', error);
            }
            return false;
          };
          
          // Try to find and navigate immediately, then retry if needed
          let found = await findAndNavigateToConversation(0);
          
          // If not found immediately, retry with exponential backoff
          if (!found) {
            let attempts = 0;
            const maxAttempts = 8;
            const retryInterval = setInterval(async () => {
              attempts++;
              found = await findAndNavigateToConversation(attempts);
              if (found || attempts >= maxAttempts) {
                clearInterval(retryInterval);
                if (!found && onMessageSent) {
                  onMessageSent();
                }
              }
            }, 1500); // Wait 1.5 seconds between retries
          }
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
          <div className="space-y-2">
            <Label htmlFor="customerPhone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Recipient Phone Number *
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              placeholder="+201557000970 or 01557000970"
              value={customerPhone}
            onChange={(e) => {
              // Allow manual editing but keep it synced
              setCustomerPhone(e.target.value);
            }}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
            Egyptian numbers will be auto-formatted (01557000970 → +201557000970).
            </p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Select Template
          </Label>
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
          
          {/* Template Preview Box */}
          {selectedTemplate && (() => {
            const selectedTemplateData = templates.find(t => t.sid === selectedTemplate);
            
            if (!selectedTemplateData) {
              return (
                <div className="mt-3 p-4 bg-muted/30 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground italic">Template data not found</p>
                </div>
              );
            }
            
            // Extract template content from various possible locations
            // Twilio templates can have content in different paths depending on channel
            let previewContent = '';
            let previewHeader = '';
            const raw = selectedTemplateData.rawTemplate;
            
            if (raw) {
              // Try multiple paths to extract content (WhatsApp, SMS, Facebook, etc.)
              // Path 1: types.whatsapp.body
              if (raw.types?.whatsapp?.body) {
                previewContent = raw.types.whatsapp.body;
              }
              // Path 2: types.text.body
              else if (raw.types?.text?.body) {
                previewContent = raw.types.text.body;
              }
              // Path 3: types.facebook.body
              else if (raw.types?.facebook?.body) {
                previewContent = raw.types.facebook.body;
              }
              // Path 4: types.sms.body
              else if (raw.types?.sms?.body) {
                previewContent = raw.types.sms.body;
              }
              // Path 5: Direct body property
              else if (raw.body) {
                previewContent = raw.body;
              }
              // Path 6: Try to get from any type
              else if (raw.types) {
                const typeKeys = Object.keys(raw.types);
                for (const key of typeKeys) {
                  if (raw.types[key]?.body) {
                    previewContent = raw.types[key].body;
                    break;
                  }
                }
              }
              
              // Extract header
              if (raw.types?.whatsapp?.header) {
                previewHeader = raw.types.whatsapp.header;
              } else if (raw.types?.text?.header) {
                previewHeader = raw.types.text.header;
              } else if (raw.types?.facebook?.header) {
                previewHeader = raw.types.facebook.header;
              } else if (raw.types) {
                const typeKeys = Object.keys(raw.types);
                for (const key of typeKeys) {
                  if (raw.types[key]?.header) {
                    previewHeader = raw.types[key].header;
                    break;
                  }
                }
              }
            }
            
            // Always show preview box, even if empty
            return (
              <div className="mt-3 p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Template Preview</p>
                </div>
                
                {previewHeader && (
                  <div className="mb-2 p-2 bg-background rounded border border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Header:</p>
                    <p className="text-sm text-foreground">{previewHeader}</p>
                  </div>
                )}
                
                {previewContent ? (
                  <div className="p-2 bg-background rounded border border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Body:</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                      {previewContent}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 bg-background rounded border border-border/50">
                    <p className="text-xs text-muted-foreground italic">
                      Preview content not available. Template: {selectedTemplateData.friendlyName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Check browser console for template structure details.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
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
