import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to simulate a media message
export async function POST(req: NextRequest) {
  try {
    const { mediaType, mediaUrl, conversationSid } = await req.json();
    
    console.log('🧪 Testing media message display:', { mediaType, mediaUrl, conversationSid });
    
    // Simulate a media message
    const testMessage = {
      id: `test-${Date.now()}`,
      text: 'Test media message',
      timestamp: new Date().toISOString(),
      sender: 'customer' as const,
      senderId: 'test-customer',
      mediaType: mediaType || 'document',
      mediaUrl: mediaUrl || 'https://via.placeholder.com/300x200?text=Test+Document',
      mediaContentType: 'application/pdf',
      mediaFileName: 'test-document.pdf',
      mediaCaption: 'This is a test document'
    };
    
    console.log('📝 Test message created:', testMessage);
    
    return NextResponse.json({
      success: true,
      message: 'Test media message created',
      testMessage
    });
  } catch (error) {
    console.error('❌ Test media message error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Media message test endpoint',
    usage: 'POST with { mediaType, mediaUrl, conversationSid } to test media display'
  });
}
