import { NextRequest, NextResponse } from 'next/server';
import { listMessages, getTwilioClient } from '@/lib/twilio-service';
import { getNumberById, getDefaultNumber, getWhatsAppNumber } from '@/lib/multi-number-config';
import { normalizePhoneNumber } from '@/lib/utils';

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
      // Normalize customer phone number
      const normalizedCustomerPhone = normalizePhoneNumber(customerPhone);
      console.log('📤 Sending template message:', {
        contentSid,
        contentVariables,
        customerPhone: customerPhone,
        normalizedCustomerPhone: normalizedCustomerPhone,
        fromNumberId: fromNumberId
      });

      // Determine which number to use for sending
      let fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
      
      console.log('📱 Template message - fromNumberId received:', fromNumberId);
      
      if (fromNumberId) {
        // Use the specified number ID
        const numberConfig = getNumberById(fromNumberId);
        if (numberConfig) {
          fromNumber = getWhatsAppNumber(numberConfig.number);
          console.log('✅ Using selected number:', numberConfig.name, `(${fromNumber})`);
        } else {
          console.warn('⚠️ Number ID not found:', fromNumberId, '- falling back to default');
        }
      } else {
        // Fallback to default number
        const defaultNumber = getDefaultNumber();
        if (defaultNumber) {
          fromNumber = getWhatsAppNumber(defaultNumber.number);
          console.log('📱 Using default number:', defaultNumber.name, `(${fromNumber})`);
        }
      }

      console.log('📤 Sending template message from:', fromNumber, 'to:', `whatsapp:${normalizedCustomerPhone}`);

      // Only set statusCallback if we have a publicly accessible URL
      // Check multiple possible environment variable names
      const publicUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                       process.env.NGROK_URL || 
                       process.env.PUBLIC_URL;
      
      console.log('🔍 Checking for public URL:', {
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ? 'set' : 'not set',
        NGROK_URL: process.env.NGROK_URL ? 'set' : 'not set',
        PUBLIC_URL: process.env.PUBLIC_URL ? 'set' : 'not set',
        found: publicUrl || 'none'
      });
      
      const statusCallbackUrl = publicUrl ? `${publicUrl}/api/twilio/message-status` : undefined;
      
      if (statusCallbackUrl) {
        console.log('📬 Using status callback URL:', statusCallbackUrl);
      } else {
        console.log('⚠️ No public URL configured, status callback disabled');
        console.log('💡 To enable status callbacks, set NGROK_URL in your .env.local file');
      }

      let message;
      try {
        const messageParams: any = {
          contentSid: contentSid,
          contentVariables: contentVariables ? JSON.stringify(contentVariables) : undefined,
          from: fromNumber,
          to: `whatsapp:${normalizedCustomerPhone}`,
        };
        
        // Only add statusCallback if we have a valid public URL
        // For WhatsApp, we need to specify which events to track
        if (statusCallbackUrl) {
          messageParams.statusCallback = statusCallbackUrl;
          // Request delivery status updates for WhatsApp messages
          messageParams.statusCallbackEvent = ['sent', 'delivered', 'read', 'failed', 'undelivered'];
          // Use POST method for status callbacks
          messageParams.statusCallbackMethod = 'POST';
        }
        
        message = await twilioClient.messages.create(messageParams);

        console.log('✅ Template message sent:', {
          sid: message.sid,
          status: message.status,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage,
          to: message.to,
          from: message.from
        });

        // Check for immediate errors
        if (message.errorCode) {
          console.error('❌ Template message error:', {
            errorCode: message.errorCode,
            errorMessage: message.errorMessage,
            status: message.status
          });
          return NextResponse.json({
            success: false,
            error: `Failed to send template: ${message.errorMessage || 'Unknown error'}`,
            errorCode: message.errorCode,
            messageSid: message.sid,
            status: message.status
          }, { status: 400 });
        }
      } catch (twilioError: any) {
        console.error('❌ Twilio API error sending template:', {
          code: twilioError.code,
          message: twilioError.message,
          status: twilioError.status,
          moreInfo: twilioError.moreInfo
        });
        return NextResponse.json({
          success: false,
          error: `Twilio error: ${twilioError.message || 'Unknown error'}`,
          errorCode: twilioError.code,
          status: twilioError.status
        }, { status: twilioError.status || 500 });
      }

      // Store the message in our database so it appears in the chat
      let messageId: string | undefined;
      try {
        const { sqliteDb } = await import('@/lib/sqlite-database');
        const db = sqliteDb;
        
        messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        
        // Broadcast the new message via SSE to update UI in real-time
        try {
          const { broadcastMessage } = await import('@/lib/sse-broadcast');
          await broadcastMessage('newMessage', {
            conversationId: conversationId,
            message: {
              id: messageId,
              text: message.body || 'Template message sent',
              timestamp: new Date().toISOString(),
              sender: 'agent',
              senderId: 'admin_001',
              deliveryStatus: 'sent',
              twilioMessageSid: message.sid
            }
          });
          console.log('✅ Template message broadcasted via SSE:', messageId);
        } catch (broadcastError) {
          console.error('⚠️ Failed to broadcast template message:', broadcastError);
          // Don't fail the request if broadcast fails
        }
      } catch (dbError) {
        console.error('⚠️ Failed to store template message in database:', dbError);
        // Don't fail the request if database storage fails
      }

      return NextResponse.json({
        success: true,
        messageSid: message.sid,
        messageId: messageId, // Include messageId so client can use it
        status: message.status,
        body: message.body,
        timestamp: new Date().toISOString()
      });

    } else if (message) {
      // Normalize customer phone number
      const normalizedCustomerPhone = normalizePhoneNumber(customerPhone);
      
      // Send regular message
      console.log('📤 Sending regular message:', {
        customerPhone: customerPhone,
        normalizedCustomerPhone: normalizedCustomerPhone,
        fromNumberId: fromNumberId,
        body: message.substring(0, 50) + '...'
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
        to: `whatsapp:${normalizedCustomerPhone}`,
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