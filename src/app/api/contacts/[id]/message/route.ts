import { NextRequest, NextResponse } from 'next/server';
import { getContactById } from '@/lib/contacts-service';
import { sendTwilioMessage } from '@/lib/twilio-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const contact = await getContactById(resolvedParams.id);
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (!contact.phoneNumber) {
      return NextResponse.json(
        { error: 'Contact does not have a phone number' },
        { status: 400 }
      );
    }

    // Send message via Twilio
    const result = await sendTwilioMessage(
      contact.phoneNumber,
      message,
      'agent-1' // Default agent ID - in production, get from session
    );

    if (result.success) {
      return NextResponse.json({
        message: 'Message sent successfully',
        messageId: result.messageId
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
