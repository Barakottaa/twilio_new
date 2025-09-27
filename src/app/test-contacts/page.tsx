'use client';

import { useState, useEffect } from 'react';
import { getAllContacts, addContact, getContact } from '@/lib/contact-mapping';

export default function TestContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [testPhone, setTestPhone] = useState('+201016666348');
  const [testName, setTestName] = useState('Ahmed Hassan');

  useEffect(() => {
    setContacts(getAllContacts());
  }, []);

  const handleAddContact = () => {
    addContact(testPhone, testName);
    setContacts(getAllContacts());
  };

  const handleTestLookup = () => {
    const contact = getContact(testPhone);
    alert(`Contact lookup for ${testPhone}: ${contact ? contact.name : 'Not found'}`);
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
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Test Contact Lookup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="+201016666348"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Ahmed Hassan"
              />
            </div>
            <div className="space-x-2">
              <button
                onClick={handleAddContact}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Contact
              </button>
              <button
                onClick={handleTestLookup}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Test Lookup
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Webhook Configuration Issue</h3>
        <p className="text-yellow-700 mb-2">
          The real-time messaging issue is because Twilio webhooks can't reach localhost.
        </p>
        <p className="text-yellow-700 mb-2">
          To fix this, you need to:
        </p>
        <ol className="list-decimal list-inside text-yellow-700 space-y-1">
          <li>Install ngrok: <code className="bg-yellow-100 px-1 rounded">npm install -g ngrok</code></li>
          <li>Run: <code className="bg-yellow-100 px-1 rounded">ngrok http 9002</code></li>
          <li>Copy the https URL (e.g., https://abc123.ngrok.io)</li>
          <li>In Twilio Console, set webhook URL to: <code className="bg-yellow-100 px-1 rounded">https://abc123.ngrok.io/api/twilio/webhook</code></li>
        </ol>
      </div>
    </div>
  );
}
