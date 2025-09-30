import { NextRequest, NextResponse } from 'next/server';

// Debug endpoint to test media webhook processing
export async function POST(req: NextRequest) {
  try {
    console.log('🔍 DEBUG: Testing media webhook processing');
    
    // Get the raw body
    const body = await req.text();
    console.log('📋 Raw webhook body:', body);
    
    // Parse form data
    const formData = new URLSearchParams(body);
    const params: { [key: string]: string } = {};
    formData.forEach((value, key) => {
      params[key] = value;
    });
    
    console.log('📋 Parsed webhook parameters:');
    Object.keys(params).forEach(key => {
      console.log(`  ${key}: ${params[key]}`);
    });
    
    // Check for media-specific parameters
    const numMedia = parseInt(params.NumMedia || '0', 10);
    console.log('📸 Number of media files:', numMedia);
    
    if (numMedia > 0) {
      console.log('🎯 Media files detected!');
      for (let i = 0; i < numMedia; i++) {
        const mediaUrl = params[`MediaUrl${i}`];
        const contentType = params[`MediaContentType${i}`];
        console.log(`  Media ${i}:`);
        console.log(`    URL: ${mediaUrl}`);
        console.log(`    Content Type: ${contentType}`);
      }
    } else {
      console.log('❌ No media files detected');
    }
    
    // Check event type
    const eventType = params.EventType;
    console.log('📨 Event type:', eventType);
    
    // Check if this is a message event
    if (eventType === 'onMessageAdded' || eventType === 'onMessageReceived') {
      console.log('✅ This is a message event');
    } else {
      console.log('⚠️ This is not a message event');
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        eventType,
        numMedia,
        hasMedia: numMedia > 0,
        mediaFiles: numMedia > 0 ? Array.from({ length: numMedia }, (_, i) => ({
          url: params[`MediaUrl${i}`],
          contentType: params[`MediaContentType${i}`]
        })) : [],
        allParams: params
      }
    });
  } catch (error) {
    console.error('❌ Debug webhook error:', error);
    return NextResponse.json(
      { error: 'Debug webhook failed', details: error },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Media webhook debug endpoint',
    usage: 'Send a POST request with webhook data to debug media processing'
  });
}
