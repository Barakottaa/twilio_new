'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  User, 
  Phone, 
  MessageSquare,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { WhatsAppMessageComposer } from '@/components/chat/whatsapp-message-composer';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Link from 'next/link';

interface Contact {
  id: string;
  name: string;
  phoneNumber?: string;
  avatar?: string;
  lastMessageTime?: string;
}

function SendMessageContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [lastCustomerMessage, setLastCustomerMessage] = useState<string | undefined>();
  const [conversationId, setConversationId] = useState<string | undefined>();

  // Get contact from URL params if provided
  const contactId = searchParams.get('contactId');

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch('/api/contacts');
        if (response.ok) {
          const data = await response.json();
          setContacts(data);
          setFilteredContacts(data);
          
          // Auto-select contact if ID provided in URL
          if (contactId) {
            const contact = data.find((c: Contact) => c.id === contactId);
            if (contact) {
              setSelectedContact(contact);
            }
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch contacts",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch contacts",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [contactId, toast]);

  // Filter contacts based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phoneNumber?.includes(searchQuery)
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  // Fetch last customer message when contact is selected
  useEffect(() => {
    if (selectedContact && selectedContact.phoneNumber) {
      fetchLastCustomerMessage(selectedContact.phoneNumber);
    }
  }, [selectedContact]);

  const fetchLastCustomerMessage = async (phoneNumber: string) => {
    setIsLoadingMessages(true);
    console.log('🔍 Fetching last customer message for phone:', phoneNumber);
    try {
      // Normalize phone number
      const { normalizePhoneNumber } = await import('@/lib/utils');
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      console.log('📱 Normalized phone:', normalizedPhone);
      
      // Find conversation for this phone number
      const response = await fetch(`/api/twilio/conversations/find-by-phone?phone=${encodeURIComponent(normalizedPhone)}&limit=1`);
      if (response.ok) {
        const data = await response.json();
        console.log('📞 Conversation data:', data);
        if (data.success && data.items && data.items.length > 0) {
          const conversation = data.items[0];
          console.log('💬 Found conversation:', conversation.id);
          setConversationId(conversation.id); // Store the actual Twilio conversation ID
          // Get more messages to find the last customer message
          const messagesResponse = await fetch(`/api/twilio/messages?conversationId=${conversation.id}&limit=50`);
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            console.log('📨 Messages data:', messagesData);
            if (messagesData.success && messagesData.messages && messagesData.messages.length > 0) {
              console.log('🔍 Sample message structure:', messagesData.messages[0]);
              console.log('🔍 All message senders:', messagesData.messages.map((msg: any) => ({
                sender: msg.sender,
                senderType: msg.senderType,
                author: msg.author,
                index: msg.index
              })));
              
              // Find the most recent customer message (check multiple possible fields)
              const customerMessage = messagesData.messages.find((msg: any) => {
                const isCustomer = (msg.sender === 'contact') || 
                                 (msg.sender === 'customer') || 
                                 (msg.senderType === 'customer') ||
                                 (msg.author && !msg.author.startsWith('agent') && !msg.author.startsWith('admin'));
                console.log('🔍 Checking message:', {
                  sender: msg.sender,
                  senderType: msg.senderType,
                  author: msg.author,
                  isCustomer: isCustomer
                });
                return isCustomer;
              });
              console.log('👤 Last customer message:', customerMessage);
              if (customerMessage) {
                console.log('✅ Setting last customer message timestamp:', customerMessage.timestamp);
                setLastCustomerMessage(customerMessage.timestamp);
              } else {
                console.log('❌ No customer message found');
                setLastCustomerMessage(undefined);
              }
            } else {
              console.log('❌ No messages found');
              setLastCustomerMessage(undefined);
            }
          }
        } else {
          console.log('❌ No conversation found for phone:', normalizedPhone);
          setLastCustomerMessage(undefined);
          setConversationId(undefined);
        }
      }
    } catch (error) {
      console.error('Error fetching last customer message:', error);
      setLastCustomerMessage(undefined);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleMessageSent = (message: any) => {
    toast({
      title: "Message Sent",
      description: `Message sent to ${selectedContact?.name}`,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">Loading contacts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/contacts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contacts
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Send Message</h1>
            <p className="text-muted-foreground">Send WhatsApp messages to your contacts</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {contacts.length} contacts
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Contact List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                  className={`group p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedContact?.id === contact.id
                      ? 'border-primary bg-gradient-to-r from-primary/10 to-primary/5 shadow-md'
                      : 'border-border hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:border-muted-foreground/10 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-background transition-all duration-200 group-hover:ring-primary/30">
                        <AvatarImage src={contact.avatar} alt={contact.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm">
                          {contact.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-foreground truncate mb-1">{contact.name}</h3>
                      {contact.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 text-primary" />
                          <span className="font-medium">{contact.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                    {selectedContact?.id === contact.id && (
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white text-xs font-bold px-3 py-1">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredContacts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No contacts found</p>
                  <p className="text-sm">Try adjusting your search</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message Composer */}
        <div>
          {selectedContact ? (
            <WhatsAppMessageComposer
              conversationId={conversationId || selectedContact.id}
              customerPhone={selectedContact.phoneNumber || ''}
              customerName={selectedContact.name}
              lastCustomerMessage={lastCustomerMessage}
              onMessageSent={handleMessageSent}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Contact</h3>
                <p className="text-muted-foreground">
                  Choose a contact from the list to start sending messages
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SendMessagePage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SendMessageContent />
    </Suspense>
  );
}
