import { NextRequest, NextResponse } from 'next/server';
import { twilio } from 'twilio';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, name, message } = await req.json();
    
    if (!phoneNumber || !name || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, name, message' },
        { status: 400 }
      );
    }

    // Create a test conversation with a new contact
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    
    // Create a new conversation
    const conversation = await client.conversations.v1.conversations.create({
      friendlyName: `Test conversation with ${name}`,
      attributes: JSON.stringify({
        test: true,
        created_by: 'test_endpoint'
      })
    });

    console.log('✅ Created test conversation:', conversation.sid);

    // Add the customer participant
    const customerParticipant = await client.conversations.v1
      .conversations(conversation.sid)
      .participants
      .create({
        'messagingBinding.address': `whatsapp:${phoneNumber}`,
        'messagingBinding.proxyAddress': process.env.TWILIO_WHATSAPP_NUMBER,
        attributes: JSON.stringify({
          display_name: name,
          phone_number: phoneNumber
        })
      });

    console.log('✅ Added customer participant:', customerParticipant.sid);

    // Add admin participant
    const adminParticipant = await client.conversations.v1
      .conversations(conversation.sid)
      .participants
      .create({
        identity: 'admin_001',
        attributes: JSON.stringify({
          display_name: 'Admin',
          role: 'agent'
        })
      });

    console.log('✅ Added admin participant:', adminParticipant.sid);

    // Send a message from the customer
    const messageResponse = await client.conversations.v1
      .conversations(conversation.sid)
      .messages
      .create({
        author: customerParticipant.sid,
        body: message,
        attributes: JSON.stringify({
          display_name: name,
          phone_number: phoneNumber
        })
      });

    console.log('✅ Sent test message:', messageResponse.sid);

    return NextResponse.json({
      success: true,
      conversationSid: conversation.sid,
      customerParticipantSid: customerParticipant.sid,
      adminParticipantSid: adminParticipant.sid,
      messageSid: messageResponse.sid,
      message: `Test conversation created with ${name} (${phoneNumber})`
    });

  } catch (error) {
    console.error('❌ Error creating test contact:', error);
    return NextResponse.json(
      { error: 'Failed to create test contact', details: String(error) },
      { status: 500 }
    );
  }
}
