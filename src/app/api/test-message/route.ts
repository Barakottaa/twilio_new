import { NextRequest, NextResponse } from 'next/server';
import { broadcastMessage } from '@/lib/sse-broadcast';

export async function POST(req: NextRequest) {
  try {
    const { conversationSid, messageType = 'text' } = await req.json();
    
    console.log('🧪 TEST MESSAGE ENDPOINT CALLED');
    console.log('🧪 Testing message broadcast for conversation:', conversationSid);
    console.log('🧪 Message type:', messageType);
    
    let testData;
    
    if (messageType === 'pdf') {
      // Test PDF message
      testData = {
        conversationSid: conversationSid || 'test-conversation-123',
        messageSid: 'test-message-' + Date.now(),
        body: '', // Empty body for PDF
        author: 'whatsapp:+1234567890',
        dateCreated: new Date().toISOString(),
        index: '1',
        numMedia: 1,
        mediaMessages: [{
          type: 'document',
          url: 'https://example.com/test.pdf',
          contentType: 'application/pdf',
          fileName: 'test-document.pdf',
          caption: 'Document: test-document.pdf'
        }],
        profileName: 'Test User',
        waId: '1234567890',
        from: 'whatsapp:+1234567890'
      };
    } else {
      // Test text message
      testData = {
        conversationSid: conversationSid || 'test-conversation-123',
        messageSid: 'test-message-' + Date.now(),
        body: 'Test message from new number',
        author: 'whatsapp:+1234567890',
        dateCreated: new Date().toISOString(),
        index: '1',
        numMedia: 0,
        mediaMessages: [],
        profileName: 'New Test User',
        waId: '1234567890',
        from: 'whatsapp:+1234567890'
      };
    }
    
    console.log('📡 Broadcasting test message:', testData);
    console.log('📡 About to call broadcastMessage...');
    
    // Test if broadcastMessage is working
    try {
      broadcastMessage('newMessage', testData);
      console.log('📡 broadcastMessage called successfully');
    } catch (error) {
      console.error('❌ Error calling broadcastMessage:', error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test message broadcasted',
      data: testData
    });
  } catch (error) {
    console.error('❌ Test message error:', error);
    return NextResponse.json(
      { error: 'Test message failed', details: error.message },
      { status: 500 }
    );
  }
}
