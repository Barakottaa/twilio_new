'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { addContact, getAllContacts } from '@/lib/contact-mapping';

export function ContactManager() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddContact = () => {
    if (phoneNumber && name) {
      addContact(phoneNumber, name, avatar || undefined);
      setPhoneNumber('');
      setName('');
      setAvatar('');
      setIsOpen(false);
      // Refresh the page to see the new contact
      window.location.reload();
    }
  };

  const contacts = getAllContacts();

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Contact Management</h3>
      
      <div className="mb-4">
        <h4 className="font-medium mb-2">Current Contacts:</h4>
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div key={contact.phoneNumber} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                {contact.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{contact.name}</div>
                <div className="text-sm text-gray-600">{contact.phoneNumber}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>Add New Contact</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+201016666348"
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahmed Hassan"
              />
            </div>
            <div>
              <Label htmlFor="avatar">Avatar URL (optional)</Label>
              <Input
                id="avatar"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <Button onClick={handleAddContact} className="w-full">
              Add Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
