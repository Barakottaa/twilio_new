import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Debug webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 DEBUG WEBHOOK - Raw request received');
    
    // Get all headers
    const headers: { [key: string]: string } = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    console.log('📋 Headers:', headers);
    
    // Get raw body
    const body = await req.text();
    console.log('📋 Raw body:', body);
    
    // Parse form data
    const formData = new URLSearchParams(body);
    const params: { [key: string]: string } = {};
    formData.forEach((value, key) => {
      params[key] = value;
    });
    
    console.log('📋 Parsed parameters:', params);
    
    // Check for media
    const numMedia = parseInt(params.NumMedia || '0', 10);
    console.log('📸 Media debug - NumMedia:', numMedia);
    
    if (numMedia > 0) {
      console.log('🎯 Media files detected!');
      for (let i = 0; i < numMedia; i++) {
        console.log(`  Media ${i}:`, {
          url: params[`MediaUrl${i}`],
          contentType: params[`MediaContentType${i}`]
        });
      }
    }
    
    // Check message details
    console.log('📨 Message details:', {
      EventType: params.EventType,
      Body: params.Body,
      Author: params.Author,
      From: params.From,
      ProfileName: params.ProfileName,
      WaId: params.WaId,
      ConversationSid: params.ConversationSid,
      MessageSid: params.MessageSid,
      NumMedia: numMedia
    });
    
    return NextResponse.json({
      success: true,
      message: 'Debug webhook processed',
      data: {
        headers,
        params,
        numMedia,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Debug webhook error:', error);
    return NextResponse.json(
      { error: 'Debug webhook failed', details: error.message },
      { status: 500 }
    );
  }
}
