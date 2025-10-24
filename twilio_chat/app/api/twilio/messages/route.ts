import { NextRequest, NextResponse } from 'next/server';
import { listMessages, getTwilioClient } from '@/lib/twilio-service';
import { getNumberById, getDefaultNumber, getWhatsAppNumber } from '@/lib/multi-number-config';

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
    console.log('📨 Received message request:', body);
    
    const { 
      conversationId, 
      customerPhone, 
      message, 
      isTemplate = false, 
      contentSid, 
      contentVariables,
      fromNumberId // New: ID of the Twilio number to send from
    } = body;

    console.log('🔍 Parsed request data:', {
      conversationId,
      customerPhone,
      message,
      isTemplate,
      contentSid,
      contentVariables
    });

    if (!conversationId || !customerPhone) {
      console.log('❌ Missing required fields:', { conversationId, customerPhone });
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
        from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886', // Use environment variable or fallback to sandbox
        to: `whatsapp:${customerPhone}`,
      });

      console.log('✅ Template message sent:', message.sid);

      // Store the message in our database so it appears in the chat
      try {
        const { sqliteDb } = await import('@/lib/sqlite-database');
        const db = sqliteDb;
        
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.createMessage({
          id: messageId,
          conversation_id: conversationId,
          sender_id: 'admin_001', // Default admin user
          sender_type: 'agent',
          content: message.body || 'Template message sent',
          message_type: 'text',
          twilio_message_sid: message.sid,
          delivery_status: 'sent',
          created_at: new Date().toISOString()
        });
        
        console.log('✅ Template message stored in database:', messageId);
      } catch (dbError) {
        console.error('⚠️ Failed to store template message in database:', dbError);
        // Don't fail the request if database storage fails
      }

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

      // Determine which number to send from
      let fromNumber: string;
      if (fromNumberId) {
        const selectedNumber = getNumberById(fromNumberId);
        if (selectedNumber) {
          fromNumber = getWhatsAppNumber(selectedNumber.number);
          console.log(`📱 Using selected number: ${selectedNumber.name} (${selectedNumber.number})`);
        } else {
          console.log(`⚠️ Number ID ${fromNumberId} not found, using default`);
          const defaultNumber = getDefaultNumber();
          fromNumber = defaultNumber ? getWhatsAppNumber(defaultNumber.number) : process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
        }
      } else {
        const defaultNumber = getDefaultNumber();
        fromNumber = defaultNumber ? getWhatsAppNumber(defaultNumber.number) : process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
      }

      const twilioMessage = await twilioClient.messages.create({
        body: message,
        from: fromNumber,
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