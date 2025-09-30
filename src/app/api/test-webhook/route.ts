// Test endpoint to manually trigger webhook behavior
import { NextRequest, NextResponse } from 'next/server';
import { broadcastMessage } from '@/lib/sse-broadcast';
import { invalidateConversationCache } from '@/lib/twilio-service';

export async function POST(req: NextRequest) {
  try {
    const { conversationSid, messageBody, author } = await req.json();
    
    console.log('🧪 Test webhook triggered:', { conversationSid, messageBody, author });
    
    // Invalidate cache
    await invalidateConversationCache(conversationSid);
    
    // Broadcast message
    broadcastMessage('newMessage', {
      conversationSid: conversationSid || 'CH14dc12689a9e4a2cb8aa5c544ac87e31',
      messageSid: `test-msg-${Date.now()}`,
      body: messageBody || 'Test message from webhook',
      author: author || 'whatsapp:+201016666348',
      dateCreated: new Date().toISOString(),
      index: '0'
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook triggered',
      conversationSid: conversationSid || 'CH14dc12689a9e4a2cb8aa5c544ac87e31'
    });
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    return NextResponse.json({ error: 'Test webhook failed' }, { status: 500 });
  }
}
