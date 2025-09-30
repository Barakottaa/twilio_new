'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface TwilioConversation {
  id: string;
  friendlyName: string;
  customerName: string;
  participantCount: number;
  hasMessages: boolean;
  dateCreated: string;
  dateUpdated: string;
  participants: Array<{
    identity: string;
    messagingBinding: any;
    attributes: string;
  }>;
  error?: string;
}

interface DebugResponse {
  success: boolean;
  totalConversations: number;
  conversations: TwilioConversation[];
  timestamp: string;
  error?: string;
}

export default function DebugConversationsPage() {
  const [data, setData] = useState<DebugResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [webhookConfig, setWebhookConfig] = useState<any>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/twilio-conversations');
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to fetch conversations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const createTestConversation = async () => {
    setTestLoading(true);
    try {
      const testPhoneNumber = `whatsapp:+${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      const testMessage = `Test message from ${testPhoneNumber} at ${new Date().toLocaleString()}`;
      
      console.log('🧪 Creating test conversation with:', testPhoneNumber);
      
      const response = await fetch('/api/test-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: testPhoneNumber,
          message: testMessage
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Test conversation created:', result);
        alert(`Test conversation created successfully!\nConversation SID: ${result.conversationSid}\nPhone: ${testPhoneNumber}`);
        // Refresh the conversations list
        fetchConversations();
      } else {
        console.error('❌ Test conversation failed:', result);
        alert(`Test conversation failed: ${result.error}`);
      }
    } catch (err) {
      console.error('❌ Test conversation error:', err);
      alert(`Test conversation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTestLoading(false);
    }
  };

  const checkWebhookConfig = async () => {
    setWebhookLoading(true);
    try {
      const response = await fetch('/api/check-webhook-config');
      const result = await response.json();
      
      if (result.success) {
        setWebhookConfig(result);
        console.log('🔍 Webhook config:', result);
      } else {
        console.error('❌ Webhook config check failed:', result);
        alert(`Webhook config check failed: ${result.error}`);
      }
    } catch (err) {
      console.error('❌ Webhook config error:', err);
      alert(`Webhook config error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setWebhookLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Twilio Conversations Debug</h1>
        <p className="text-gray-600 mb-4">
          Compare conversations in Twilio with what's showing in your UI
        </p>
        <div className="flex gap-2">
          <Button onClick={fetchConversations} disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Refresh'}
          </Button>
          <Button 
            onClick={createTestConversation} 
            disabled={testLoading}
            variant="outline"
          >
            {testLoading ? <LoadingSpinner size="sm" /> : 'Create Test Conversation'}
          </Button>
          <Button 
            onClick={checkWebhookConfig} 
            disabled={webhookLoading}
            variant="secondary"
          >
            {webhookLoading ? <LoadingSpinner size="sm" /> : 'Check Webhook Config'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {webhookConfig && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Environment Webhook URL:</strong> {webhookConfig.environmentWebhookUrl || 'Not set'}</p>
              <p><strong>Current App URL:</strong> {webhookConfig.currentAppUrl}</p>
              <p><strong>Messaging Services:</strong> {webhookConfig.webhookConfig.totalServices}</p>
              {webhookConfig.webhookConfig.messagingServices.map((service: any, index: number) => (
                <div key={index} className="ml-4 p-2 bg-white rounded border">
                  <p><strong>Service {index + 1}:</strong> {service.friendlyName}</p>
                  <p><strong>SID:</strong> {service.sid}</p>
                  <p><strong>Inbound URL:</strong> {service.inboundRequestUrl || 'Not set'}</p>
                  <p><strong>Status Callback:</strong> {service.statusCallback || 'Not set'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Conversations</p>
                  <p className="text-2xl font-bold">{data.totalConversations}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">With Messages</p>
                  <p className="text-2xl font-bold">
                    {data.conversations.filter(c => c.hasMessages).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-sm">{formatDate(data.timestamp)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {data.conversations.map((conversation) => (
              <Card key={conversation.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {conversation.customerName}
                      </CardTitle>
                      <p className="text-sm text-gray-600 font-mono">
                        {conversation.id}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {conversation.hasMessages && (
                        <Badge variant="default">Has Messages</Badge>
                      )}
                      <Badge variant="outline">
                        {conversation.participantCount} participants
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="text-sm">{formatDate(conversation.dateCreated)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Updated</p>
                      <p className="text-sm">{formatDate(conversation.dateUpdated)}</p>
                    </div>
                  </div>
                  
                  {conversation.friendlyName && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Friendly Name</p>
                      <p className="text-sm font-mono">{conversation.friendlyName}</p>
                    </div>
                  )}

                  {conversation.error && (
                    <div className="mt-2 p-2 bg-red-100 rounded">
                      <p className="text-sm text-red-600">Error: {conversation.error}</p>
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Participants:</p>
                    <div className="space-y-1">
                      {conversation.participants.map((participant, index) => (
                        <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                          <p><strong>Identity:</strong> {participant.identity || 'null'}</p>
                          {participant.messagingBinding && (
                            <p><strong>Type:</strong> {participant.messagingBinding.type}</p>
                          )}
                          {participant.messagingBinding?.address && (
                            <p><strong>Address:</strong> {participant.messagingBinding.address}</p>
                          )}
                          {participant.attributes && (
                            <p><strong>Attributes:</strong> {participant.attributes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
