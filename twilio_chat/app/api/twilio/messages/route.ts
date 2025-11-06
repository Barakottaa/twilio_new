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

      // Find or create conversation FIRST, before sending the message
      // This ensures the message is associated with the Conversations service
      let actualConversationSid = conversationId;
      try {
        // Try to find existing conversation by phone number
        console.log('🔍 Finding or creating conversation for phone:', normalizedCustomerPhone);
        const conversations = await twilioClient.conversations.v1.conversations.list({ limit: 50 });
        
        for (const conv of conversations) {
          try {
            const participants = await twilioClient.conversations.v1
              .conversations(conv.sid)
              .participants.list();
            
            const customerParticipant = participants.find(p => 
              p.messagingBinding?.address === `whatsapp:${normalizedCustomerPhone}`
            );
            
            if (customerParticipant) {
              actualConversationSid = conv.sid;
              console.log('✅ Found existing conversation:', actualConversationSid);
              break;
            }
          } catch (err) {
            // Continue checking other conversations
          }
        }
        
        // If not found, create a new conversation
        if (!actualConversationSid || actualConversationSid.startsWith('new_')) {
          console.log('🔍 Creating new conversation...');
          const newConversation = await twilioClient.conversations.v1.conversations.create({
            friendlyName: `Chat with ${normalizedCustomerPhone}`,
            attributes: JSON.stringify({ 
              phone: normalizedCustomerPhone,
              createdVia: 'template_message'
            })
          });
          
          // Add customer as participant with display_name attribute
          await twilioClient.conversations.v1
            .conversations(newConversation.sid)
            .participants.create({
              'messagingBinding.address': `whatsapp:${normalizedCustomerPhone}`,
              'messagingBinding.proxyAddress': fromNumber,
              attributes: JSON.stringify({
                display_name: normalizedCustomerPhone.replace(/^\+/, ''),
                phone: normalizedCustomerPhone
              })
            });
          
          // Add admin as participant
          await twilioClient.conversations.v1
            .conversations(newConversation.sid)
            .participants.create({
              identity: 'admin_001'
            });
          
          actualConversationSid = newConversation.sid;
          console.log('✅ Created new conversation:', actualConversationSid);
        }
      } catch (convError) {
        console.error('⚠️ Error finding/creating conversation:', convError);
        // Continue with temporary ID if we can't find/create
      }

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
          // Associate with conversation service - this is critical!
          // This ensures the message appears in the Conversations service
          conversationSid: actualConversationSid && !actualConversationSid.startsWith('new_') 
            ? actualConversationSid 
            : undefined
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
        
        console.log('📤 Sending template message with conversationSid:', messageParams.conversationSid);
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
          conversation_id: actualConversationSid,
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
        // Use the same format as conversations-events webhook for consistency
        try {
          const { broadcastMessage } = await import('@/lib/sse-broadcast');
          await broadcastMessage('newMessage', {
            conversationSid: actualConversationSid,
            messageSid: message.sid,
            body: message.body || 'Template message sent',
            author: 'admin_001',
            dateCreated: new Date().toISOString(),
            index: '0',
            numMedia: 0,
            media: [],
            phone: normalizedCustomerPhone
          });
          console.log('✅ Template message broadcasted via SSE:', message.sid);
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
        conversationSid: actualConversationSid, // Return the actual conversation SID
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