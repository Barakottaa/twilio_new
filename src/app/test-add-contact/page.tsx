'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { addContact, getContact, getAllContacts } from '@/lib/contact-mapping';

export default function TestAddContactPage() {
  const [phoneNumber, setPhoneNumber] = useState('+201016666348');
  const [contactName, setContactName] = useState('Ahmed Hassan');
  const [result, setResult] = useState<string>('');
  const [allContacts, setAllContacts] = useState(getAllContacts());

  const handleAddContact = () => {
    try {
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=random`;
      addContact(phoneNumber, contactName, avatar);
      
      setResult(`✅ Contact added: ${contactName} (${phoneNumber})`);
      setAllContacts(getAllContacts());
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestLookup = () => {
    const contact = getContact(phoneNumber);
    if (contact) {
      setResult(`✅ Found contact: ${contact.name} (${contact.phoneNumber})`);
    } else {
      setResult(`❌ Contact not found for: ${phoneNumber}`);
    }
  };

  const handleRefreshContacts = () => {
    setAllContacts(getAllContacts());
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Contact Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add/Test Contact</CardTitle>
            <CardDescription>
              Manually add a contact for testing purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+201016666348"
              />
            </div>
            
            <div>
              <Label htmlFor="name">Contact Name</Label>
              <Input
                id="name"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ahmed Hassan"
              />
            </div>
            
            <div className="space-x-2">
              <Button onClick={handleAddContact}>Add Contact</Button>
              <Button onClick={handleTestLookup} variant="secondary">Test Lookup</Button>
            </div>
            
            {result && (
              <div className={`p-3 rounded-lg ${result.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {result}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Contacts</CardTitle>
            <CardDescription>
              All contacts in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button onClick={handleRefreshContacts} variant="outline" className="mb-4">
                Refresh Contacts
              </Button>
              
              {allContacts.length === 0 ? (
                <p className="text-muted-foreground">No contacts added yet.</p>
              ) : (
                allContacts.map((contact, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-md">
                    <img 
                      src={contact.avatar} 
                      alt={contact.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.phoneNumber}</p>
                      {contact.lastSeen && (
                        <p className="text-xs text-muted-foreground">
                          Last seen: {new Date(contact.lastSeen).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">How to Test Real WhatsApp Names</h3>
        <ol className="text-blue-700 space-y-1">
          <li>1. <strong>Add a test contact</strong> using the form above</li>
          <li>2. <strong>Go back to your main chat app</strong> and refresh</li>
          <li>3. <strong>You should see the contact name</strong> instead of the formatted phone number</li>
          <li>4. <strong>For real WhatsApp names</strong>, someone needs to send a new message to your Twilio WhatsApp number</li>
        </ol>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Why You Don't See WhatsApp Names Yet</h3>
        <ul className="text-yellow-700 space-y-1">
          <li>• <strong>Existing conversations</strong> don't have ProfileName data</li>
          <li>• <strong>ProfileName is only sent</strong> when someone sends a NEW message</li>
          <li>• <strong>Your current conversations</strong> were created before we implemented this feature</li>
          <li>• <strong>Solution:</strong> Have someone send a new WhatsApp message to your Twilio number</li>
        </ul>
      </div>
    </div>
  );
}
