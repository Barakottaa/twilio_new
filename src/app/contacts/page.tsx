'use client';

import { useState, useEffect } from 'react';
import type { Customer } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserCheck, 
  Plus,
  MessageSquare,
  Edit,
  Trash2,
  Send,
  Phone,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Customer | null>(null);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Customer | null>(null);
  const [messageText, setMessageText] = useState('');
  const [newContact, setNewContact] = useState<Partial<Customer>>({
    name: '',
    phoneNumber: ''
  });

  // Fetch contacts function
  const fetchContacts = async () => {
    try {
      // Add a small delay to ensure loading state is visible
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
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

  // Fetch contacts from API with a small delay to show loading state
  useEffect(() => {
    fetchContacts();
  }, [toast]);

  const filteredAndSortedContacts = contacts
    .filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           contact.phoneNumber?.includes(searchQuery) ||
                           contact.email?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'phoneNumber':
          return (a.phoneNumber || '').localeCompare(b.phoneNumber || '');
        default:
          return 0;
      }
    });

  const handleAddContact = async () => {
    if (newContact.name && newContact.phoneNumber) {
      try {
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newContact.name,
            phoneNumber: newContact.phoneNumber
          }),
        });

        if (response.ok) {
          const contact = await response.json();
          setContacts(prev => [...prev, contact]);
          setNewContact({
            name: '',
            phoneNumber: ''
          });
          setIsAddDialogOpen(false);
          toast({
            title: "Success",
            description: "Contact added successfully",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add contact",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add contact",
          variant: "destructive",
        });
      }
    }
  };

  const handleSyncContacts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sync-contacts', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        
        // Refresh contacts list
        const contactsResponse = await fetch('/api/contacts');
        if (contactsResponse.ok) {
          const updatedContacts = await contactsResponse.json();
          setContacts(updatedContacts);
        }
        
        toast({
          title: "Sync Completed",
          description: result.message,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Sync Failed",
          description: error.error || "Failed to sync contacts",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync contacts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearContacts = async () => {
    if (!confirm('Are you sure you want to clear ALL contacts? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/clear-contacts', {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        
        // Clear contacts list
        setContacts([]);
        
        toast({
          title: "Contacts Cleared",
          description: result.message,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Clear Failed",
          description: error.error || "Failed to clear contacts",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear contacts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  const handleEditContact = (contact: Customer) => {
    setEditingContact(contact);
    setNewContact({
      name: contact.name || '',
      phoneNumber: contact.phoneNumber || ''
    });
  };

  const handleUpdateContact = async () => {
    if (editingContact && newContact.name) {
      try {
        const response = await fetch(`/api/contacts/${editingContact.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newContact.name,
            phoneNumber: newContact.phoneNumber
          }),
        });

        if (response.ok) {
          const updatedContact = await response.json();
          setContacts(prev => prev.map(contact => 
            contact.id === editingContact.id ? updatedContact : contact
          ));
          setEditingContact(null);
          setNewContact({
            name: '',
            phoneNumber: ''
          });
          toast({
            title: "Success",
            description: "Contact updated successfully",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update contact",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update contact",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setContacts(prev => prev.filter(contact => contact.id !== contactId));
        toast({
          title: "Success",
          description: "Contact deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete contact",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (contactId: string, message: string) => {
    setSendingMessage(contactId);
    try {
      const response = await fetch(`/api/contacts/${contactId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Message sent successfully",
        });
        setMessageDialogOpen(false);
        setMessageText('');
        setSelectedContact(null);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
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
      setSendingMessage(null);
    }
  };

  const openMessageDialog = (contact: Customer) => {
    setSelectedContact(contact);
    setMessageDialogOpen(true);
  };

  // Removed getLastSeenStatus function - no longer needed

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contacts</h1>
            <p className="text-muted-foreground">Manage customer contact information</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              Loading...
            </Badge>
          </div>
        </div>

        {/* Loading State */}
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
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage customer contact information</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredAndSortedContacts.length} contacts
          </Badge>
          <Button 
            variant="outline" 
            onClick={handleSyncContacts}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync from WhatsApp
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleClearContacts}
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Contacts
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newContact.name || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contact name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newContact.phoneNumber || ''}
                    onChange={(e) => setNewContact(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1234567890"
                  />
                  {/* Quick Prefix Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewContact(prev => ({ ...prev, phoneNumber: '+2' }))}
                      className="text-xs"
                    >
                      🇪🇬 +2 (Egypt)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewContact(prev => ({ ...prev, phoneNumber: '+1' }))}
                      className="text-xs"
                    >
                      🇺🇸 +1 (US/Canada)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewContact(prev => ({ ...prev, phoneNumber: '+44' }))}
                      className="text-xs"
                    >
                      🇬🇧 +44 (UK)
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddContact}>
                  Add Contact
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Sort
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="phoneNumber">Phone Number</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedContacts.map((contact) => {
          return (
            <Card key={contact.id} className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-lg ring-2 ring-offset-2 ring-offset-background ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-background rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-foreground mb-1">{contact.name}</h3>
                      {contact.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 text-primary" />
                          <span className="font-medium">{contact.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary/10">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                             <DropdownMenuItem asChild className="cursor-pointer">
                               <Link href={`/?chat=${contact.id}`} className="flex items-center">
                                 <MessageSquare className="w-4 h-4 mr-3 text-primary" />
                                 <span className="font-medium">Start Chat</span>
                               </Link>
                             </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openMessageDialog(contact)} className="cursor-pointer">
                        <MessageSquare className="w-4 h-4 mr-3 text-blue-600" />
                        <span className="font-medium">Send Quick Message</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`/?chat=${contact.id}`, '_blank')} className="cursor-pointer">
                        <MessageSquare className="w-4 h-4 mr-3 text-green-600" />
                        <span className="font-medium">Open in New Tab</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditContact(contact)} className="cursor-pointer">
                        <Edit className="w-4 h-4 mr-3 text-orange-600" />
                        <span className="font-medium">Edit Contact</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-3" />
                        <span className="font-medium">Delete Contact</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Contact Stats and Actions */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Online</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-medium">Active Chat</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                        onClick={() => window.open(`/?chat=${contact.id}`, '_blank')}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {filteredAndSortedContacts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
            <p className="text-muted-foreground">Try adjusting your search or add a new contact.</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Contact Dialog */}
      <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={newContact.name || ''}
                onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Contact name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={newContact.phoneNumber || ''}
                onChange={(e) => setNewContact(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="+1234567890"
              />
              {/* Quick Prefix Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewContact(prev => ({ ...prev, phoneNumber: '+2' }))}
                  className="text-xs"
                >
                  🇪🇬 +2 (Egypt)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewContact(prev => ({ ...prev, phoneNumber: '+1' }))}
                  className="text-xs"
                >
                  🇺🇸 +1 (US/Canada)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewContact(prev => ({ ...prev, phoneNumber: '+44' }))}
                  className="text-xs"
                >
                  🇬🇧 +44 (UK)
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingContact(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateContact}>
              Update Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Message to {selectedContact?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
              />
            </div>
            {selectedContact?.phoneNumber && (
              <div className="text-sm text-muted-foreground">
                Message will be sent to: {selectedContact.phoneNumber}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedContact && handleSendMessage(selectedContact.id, messageText)}
              disabled={!messageText.trim() || sendingMessage === selectedContact?.id}
            >
              {sendingMessage === selectedContact?.id ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
