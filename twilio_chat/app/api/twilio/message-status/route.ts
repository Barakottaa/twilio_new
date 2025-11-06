import { NextRequest, NextResponse } from 'next/server';
import { logTwilioWebhook, logInfo, logWarn, logError } from '@/lib/logger';

/**
 * Webhook endpoint for Twilio Message Status Callbacks
 * Receives delivery status updates for sent messages (templates and regular messages)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const params = Object.fromEntries(formData.entries());
    
    // Log all incoming webhook data
    logTwilioWebhook('Message-Status', params);
    
    const {
      MessageSid: messageSid,
      MessageStatus: status,
      ErrorCode: errorCode,
      ErrorMessage: errorMessage,
      To: to,
      From: from,
    } = params;

    console.log('📬 Message status webhook received:', {
      messageSid,
      status,
      errorCode,
      errorMessage,
      to,
      from,
      timestamp: new Date().toISOString()
    });
    
    logInfo('📬 Processing message status update', {
      messageSid,
      status,
      errorCode,
      errorMessage,
      to,
      from,
      allParams: params
    });

    if (!messageSid || !status) {
      console.warn('⚠️ Missing required fields in status webhook:', { messageSid, status });
      return NextResponse.json({ 
        success: false, 
        error: 'MessageSid and MessageStatus are required' 
      }, { status: 400 });
    }

    // Map Twilio status to our delivery status
    let deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';
    switch (status.toLowerCase()) {
      case 'queued':
      case 'sending':
      case 'sent':
        deliveryStatus = 'sent';
        break;
      case 'delivered':
        deliveryStatus = 'delivered';
        break;
      case 'read':
        deliveryStatus = 'read';
        break;
      case 'failed':
        deliveryStatus = 'failed';
        break;
      case 'undelivered':
        deliveryStatus = 'undelivered';
        break;
      default:
        console.log('⚠️ Unknown message status:', status);
        deliveryStatus = 'sent'; // Default fallback
    }

    // Update message delivery status in database
    let existingMessage: any = null;
    try {
      const { getDatabase } = await import('@/lib/database-config');
      const db = await getDatabase();
      
      // Find message by Twilio SID
      existingMessage = await db.getMessageByTwilioSid(messageSid as string);
      if (existingMessage) {
        await db.updateMessageDeliveryStatus(messageSid as string, deliveryStatus);
        console.log('✅ Updated message delivery status in database:', { 
          messageSid, 
          deliveryStatus,
          status,
          errorCode: errorCode || 'none',
          messageId: existingMessage.id,
          conversationId: existingMessage.conversation_id
        });
      } else {
        console.log('⚠️ Message not found in database for status update:', messageSid);
        console.log('💡 This might be a template message that needs to be found differently');
        // Still log the status for debugging
        console.log('📋 Message status details:', {
          messageSid,
          status,
          deliveryStatus,
          errorCode,
          errorMessage,
          to,
          from
        });
      }
    } catch (dbError) {
      console.error('❌ Error updating message delivery status:', dbError);
    }

    // Broadcast status update to connected clients via SSE
    try {
      const { broadcastMessage } = await import('@/lib/sse-broadcast');
      const broadcastData: any = {
        messageSid: messageSid as string,
        status: deliveryStatus,
        errorCode: errorCode ? parseInt(errorCode as string) : null,
        errorMessage: errorMessage as string || null,
        to: to as string,
        from: from as string,
        timestamp: new Date().toISOString()
      };
      
      // Include conversation ID if we found the message
      if (existingMessage) {
        broadcastData.conversationId = existingMessage.conversation_id;
      }
      
      await broadcastMessage('deliveryStatusUpdate', broadcastData);
      console.log('✅ Delivery status update broadcasted:', { 
        messageSid, 
        deliveryStatus,
        conversationId: existingMessage?.conversation_id || 'unknown'
      });
    } catch (broadcastError) {
      console.error('❌ Error broadcasting delivery status update:', broadcastError);
    }

    // Return success to Twilio
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error processing message status webhook:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

