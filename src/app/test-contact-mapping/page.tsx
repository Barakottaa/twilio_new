'use client';

import { useState, useEffect } from 'react';
import { getContact, getAllContacts, addContact } from '@/lib/contact-mapping';

export default function TestContactMappingPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    const allContacts = getAllContacts();
    setContacts(allContacts);
    console.log('📋 All contacts on page load:', allContacts);
  }, []);

  const testContactLookup = () => {
    const phoneNumber = '+201016666348';
    const contact = getContact(phoneNumber);
    
    if (contact) {
      setTestResult(`✅ Found contact: ${contact.name} (${contact.phoneNumber})`);
      console.log('✅ Contact found:', contact);
    } else {
      setTestResult(`❌ No contact found for ${phoneNumber}`);
      console.log('❌ No contact found for:', phoneNumber);
    }
  };

  const addTestContact = () => {
    addContact('+201016666348', 'Ahmed Hassan', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face');
    const updatedContacts = getAllContacts();
    setContacts(updatedContacts);
    console.log('➕ Added contact, updated list:', updatedContacts);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Contact Mapping Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Current Contacts</h2>
          <div className="space-y-2">
            {contacts.map((contact) => (
              <div key={contact.phoneNumber} className="p-2 bg-gray-50 rounded">
                <div className="font-medium">{contact.name}</div>
                <div className="text-sm text-gray-600">{contact.phoneNumber}</div>
                {contact.avatar && (
                  <img src={contact.avatar} alt={contact.name} className="w-8 h-8 rounded-full mt-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Test Contact Lookup</h2>
          <div className="space-y-4">
            <button
              onClick={testContactLookup}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Lookup +201016666348
            </button>
            
            <button
              onClick={addTestContact}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Test Contact
            </button>
            
            {testResult && (
              <div className="p-2 bg-gray-100 rounded">
                {testResult}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Debug Information</h3>
        <p className="text-blue-700 mb-2">
          Check the browser console (F12) for detailed logs about contact mapping.
        </p>
        <p className="text-blue-700">
          The contact mapping should show "Ahmed Hassan" for phone number +201016666348.
        </p>
      </div>
    </div>
  );
}
