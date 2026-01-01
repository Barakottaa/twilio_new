import { NextRequest, NextResponse } from 'next/server';
import { sendTwilioMessage } from '@/lib/twilio-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { message, author, fromNumberId } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!author) {
      return NextResponse.json(
        { error: 'Author is required' },
        { status: 400 }
      );
    }

    console.log('Sending message to conversation:', resolvedParams.id, 'from:', author);

    // Send message via Twilio
    const result = await sendTwilioMessage(
      resolvedParams.id, // conversationSid
      author, // author identity
      message // message text
    );

    if (result.success) {
      // Return a full Message object that matches Android app's expected format
      const messageResponse = {
        id: result.messageId,
        text: message,
        timestamp: new Date().toISOString(),
        sender: 'agent' as const,
        senderId: author,
        deliveryStatus: 'sent' as const,
        twilioMessageSid: result.twilioMessageSid,
      };

      return NextResponse.json({
        success: true,
        message: 'Message sent successfully',
        ...messageResponse, // Spread the message object for backward compatibility
        messageId: result.messageId,
        twilioMessageSid: result.twilioMessageSid
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to send message' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
