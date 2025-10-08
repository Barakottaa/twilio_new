import { NextRequest, NextResponse } from 'next/server';
import { listMessages, getTwilioClient } from '@/lib/twilio-service';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId');
    
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }
    
    const limit = Number(url.searchParams.get('limit') ?? 25);
    const before = url.searchParams.get('before') ?? undefined;

    // Fetching messages for conversation

    const data = await listMessages(conversationId, limit, before);
    
    const response = NextResponse.json({
      success: true,
      ...data,
      timestamp: new Date().toISOString()
    });

    // Cache messages for a short time
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      messages: [],
      nextBefore: undefined
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      conversationId, 
      customerPhone, 
      message, 
      isTemplate = false, 
      contentSid, 
      contentVariables 
    } = body;

    if (!conversationId || !customerPhone) {
      return NextResponse.json({ 
        error: 'conversationId and customerPhone are required' 
      }, { status: 400 });
    }

    const twilioClient = await getTwilioClient();

    if (isTemplate && contentSid) {
      // Send template message using Content Template Builder
      console.log('📤 Sending template message:', {
        contentSid,
        contentVariables,
        to: `whatsapp:${customerPhone}`
      });

      const message = await twilioClient.messages.create({
        contentSid: contentSid,
        contentVariables: contentVariables ? JSON.stringify(contentVariables) : undefined,
        from: 'whatsapp:+14155238886', // Your Twilio WhatsApp number
        to: `whatsapp:${customerPhone}`,
      });

      console.log('✅ Template message sent:', message.sid);

      return NextResponse.json({
        success: true,
        messageSid: message.sid,
        status: message.status,
        body: message.body,
        timestamp: new Date().toISOString()
      });

    } else if (message) {
      // Send regular message
      console.log('📤 Sending regular message:', {
        to: `whatsapp:${customerPhone}`,
        body: message
      });

      const twilioMessage = await twilioClient.messages.create({
        body: message,
        from: 'whatsapp:+14155238886', // Your Twilio WhatsApp number
        to: `whatsapp:${customerPhone}`,
      });

      console.log('✅ Regular message sent:', twilioMessage.sid);

      return NextResponse.json({
        success: true,
        messageSid: twilioMessage.sid,
        status: twilioMessage.status,
        body: twilioMessage.body,
        timestamp: new Date().toISOString()
      });

    } else {
      return NextResponse.json({ 
        error: 'Either message text or template contentSid is required' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}