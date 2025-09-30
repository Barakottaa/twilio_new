'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugPage() {
  const { agent, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [conversationSid, setConversationSid] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sseStatus, setSseStatus] = useState<string>('Disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Initialize SSE connection for debugging
  useEffect(() => {
    if (isAuthenticated && agent) {
      console.log('🔌 Debug page: Connecting to SSE...');
      setSseStatus('Connecting...');
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      const eventSource = new EventSource('/api/events');
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('✅ Debug page: SSE connection opened');
        setSseStatus('Connected');
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Debug page: SSE message received:', data);
          
          if (data.type === 'newMessage') {
            console.log('📨 Debug page: New message detected:', data.data);
            setTestResult(prev => ({
              ...prev,
              lastMessage: data.data,
              timestamp: new Date().toLocaleTimeString()
            }));
          }
        } catch (error) {
          console.error('❌ Debug page: Error parsing SSE message:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('❌ Debug page: SSE connection error:', error);
        setSseStatus('Error');
      };
      
      return () => {
        eventSource.close();
        setSseStatus('Disconnected');
      };
    }
  }, [isAuthenticated, agent]);

  const testTextMessage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationSid: conversationSid || undefined,
          messageType: 'text'
        })
      });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testPdfMessage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationSid: conversationSid || undefined,
          messageType: 'pdf'
        })
      });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhook = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          EventType: 'onMessageAdded',
          Body: 'Test message from debug',
          Author: 'whatsapp:+1234567890',
          From: 'whatsapp:+1234567890',
          ProfileName: 'Debug User',
          WaId: '1234567890',
          ConversationSid: conversationSid || 'test-conversation-123',
          MessageSid: 'test-message-' + Date.now(),
          DateCreated: new Date().toISOString(),
          Index: '1',
          NumMedia: '0'
        })
      });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !agent) {
    return null;
  }

  return (
    <MainLayout loggedInAgent={agent}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Debug Tools</h1>
          <p className="text-gray-600 mt-2">
            Test message handling and webhook functionality
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium">SSE Status:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              sseStatus === 'Connected' ? 'bg-green-100 text-green-800' :
              sseStatus === 'Connecting...' ? 'bg-yellow-100 text-yellow-800' :
              sseStatus === 'Error' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {sseStatus}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Test Message Broadcasting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="conversationSid">Conversation SID (optional)</Label>
                <Input
                  id="conversationSid"
                  value={conversationSid}
                  onChange={(e) => setConversationSid(e.target.value)}
                  placeholder="Leave empty for test conversation"
                />
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={testTextMessage} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Test Text Message'}
                </Button>
                
                <Button 
                  onClick={testPdfMessage} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Test PDF Message'}
                </Button>
                
                <Button 
                  onClick={testWebhook} 
                  disabled={isLoading}
                  variant="secondary"
                  className="w-full"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Test Webhook'}
                </Button>
                
                <Button 
                  onClick={() => {
                    console.log('🔍 Manual SSE test - Current status:', sseStatus);
                    console.log('🔍 Manual SSE test - EventSource:', eventSourceRef.current);
                    if (eventSourceRef.current) {
                      console.log('🔍 Manual SSE test - ReadyState:', eventSourceRef.current.readyState);
                    }
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  Check SSE Status
                </Button>
                
                <Button 
                  onClick={async () => {
                    console.log('🧪 Testing direct broadcast...');
                    try {
                      const response = await fetch('/api/test-message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          messageType: 'text',
                          conversationSid: 'direct-test-123'
                        })
                      });
                      const result = await response.json();
                      console.log('🧪 Direct test result:', result);
                    } catch (error) {
                      console.error('🧪 Direct test error:', error);
                    }
                  }}
                  disabled={isLoading}
                  variant="destructive"
                  className="w-full"
                >
                  Direct Broadcast Test
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              {testResult ? (
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">No test results yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Debug Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">1. Test Text Message</h3>
                <p className="text-sm text-gray-600">
                  Sends a test text message to see if new number messages appear correctly.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">2. Test PDF Message</h3>
                <p className="text-sm text-gray-600">
                  Sends a test PDF message to see if media messages display properly.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">3. Test Webhook</h3>
                <p className="text-sm text-gray-600">
                  Simulates a webhook call to test the webhook processing logic.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">4. Check Console</h3>
                <p className="text-sm text-gray-600">
                  Open browser console (F12) to see detailed logging of message processing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
