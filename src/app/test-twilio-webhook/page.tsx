'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestTwilioWebhookPage() {
  const [webhookUrl, setWebhookUrl] = useState('https://affiliation-note-eliminate-fought.trycloudflare.com/api/twilio/webhook');
  const [testPayload, setTestPayload] = useState(`EventType=onMessageAdded&Body=Hello from WhatsApp!&Author=whatsapp:+201234567890&ConversationSid=CH1234567890abcdef&MessageSid=IM1234567890abcdef&DateCreated=2023-10-01T12:00:00Z&Index=1&ProfileName=Ahmed Ali&WaId=201234567890&From=whatsapp:+201234567890`);
  const [result, setResult] = useState<string>('');

  const testWebhook = async () => {
    try {
      setResult('Testing webhook...');
      
      // Convert form data to URLSearchParams
      const formData = new URLSearchParams(testPayload);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });
      
      const responseText = await response.text();
      
      if (response.ok) {
        setResult(`✅ Success: ${responseText}`);
      } else {
        setResult(`❌ Error (${response.status}): ${responseText}`);
      }
    } catch (error) {
      setResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Twilio WhatsApp Webhook Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
            <CardDescription>
              Test the Twilio webhook endpoint with WhatsApp message data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-domain.com/api/twilio/webhook"
              />
            </div>
            
            <div>
              <Label htmlFor="test-payload">Test Payload (Form Data)</Label>
              <Textarea
                id="test-payload"
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                placeholder="EventType=onMessageAdded&Body=Hello&ProfileName=Ahmed Ali&WaId=201234567890&From=whatsapp:+201234567890"
              />
            </div>
            
            <Button onClick={testWebhook} className="w-full">
              Test Webhook
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Webhook response and processing results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">
                {result || 'No test results yet. Click "Test Webhook" to see results.'}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">How to Test</h3>
        <ol className="text-blue-700 space-y-1">
          <li>1. Make sure your app is running and accessible via the webhook URL</li>
          <li>2. Click "Test Webhook" to send the sample payload</li>
          <li>3. Check the results to see if the webhook processed correctly</li>
          <li>4. Check your main chat app to see if "Ahmed Ali" appears as a contact</li>
          <li>5. Check browser console for detailed logs</li>
        </ol>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Expected Behavior</h3>
        <ul className="text-yellow-700 space-y-1">
          <li>• Webhook should return 200 status with success message</li>
          <li>• Contact "Ahmed Ali" should be stored in the contact mapping</li>
          <li>• Phone number "+201234567890" should be formatted and stored</li>
          <li>• Avatar should be generated using UI Avatars service</li>
          <li>• Check console logs for detailed processing information</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">Key Parameters</h3>
        <ul className="text-green-700 space-y-1">
          <li>• <strong>ProfileName</strong>: "Ahmed Ali" - WhatsApp display name</li>
          <li>• <strong>WaId</strong>: "201234567890" - WhatsApp ID (phone number)</li>
          <li>• <strong>From</strong>: "whatsapp:+201234567890" - Full WhatsApp address</li>
          <li>• <strong>Body</strong>: "Hello from WhatsApp!" - Message content</li>
          <li>• <strong>EventType</strong>: "onMessageAdded" - Twilio event type</li>
        </ul>
      </div>
    </div>
  );
}
