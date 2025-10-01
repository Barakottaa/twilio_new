import { NextRequest, NextResponse } from 'next/server';
import { createContact } from '@/lib/contacts-service';
import { getTwilioClient } from '@/lib/twilio-service';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, name, message } = await req.json();
    
    if (!phoneNumber || !name || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, name, message' },
        { status: 400 }
      );
    }

    console.log('🧪 Creating test contact and conversation:', { phoneNumber, name, message });

    // Create contact in database first
    const contact = await createContact({
      name: name,
      phoneNumber: phoneNumber,
      notes: `Test contact created via test endpoint. Message: ${message}`
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Failed to create contact in database' },
        { status: 500 }
      );
    }

    console.log('✅ Created test contact:', contact.id);

    // Now create a conversation and send a message
    try {
      const client = await getTwilioClient();
      
      // Create a new conversation
      const conversation = await client.conversations.v1.conversations.create({
        friendlyName: `Test conversation with ${name}`,
        attributes: JSON.stringify({
          test: true,
          created_by: 'test_endpoint',
          contact_id: contact.id
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
        contact: contact,
        conversationSid: conversation.sid,
        messageSid: messageResponse.sid,
        message: `Test contact and conversation created: ${name} (${phoneNumber})`
      });

    } catch (twilioError) {
      console.error('❌ Error creating Twilio conversation:', twilioError);
      // Still return success for contact creation even if Twilio fails
      return NextResponse.json({
        success: true,
        contact: contact,
        message: `Test contact created: ${name} (${phoneNumber}). Twilio conversation failed.`
      });
    }

  } catch (error) {
    console.error('❌ Error creating test contact:', error);
    return NextResponse.json(
      { error: 'Failed to create test contact', details: String(error) },
      { status: 500 }
    );
  }
}
