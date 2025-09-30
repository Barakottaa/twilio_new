import { NextRequest, NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-service';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, message } = await req.json();
    
    if (!phoneNumber || !message) {
      return NextResponse.json({ 
        error: 'phoneNumber and message are required' 
      }, { status: 400 });
    }

    const client = await getTwilioClient();
    
    console.log('🧪 Test: Creating conversation for phone number:', phoneNumber);
    
    // Create a new conversation
    const conversation = await client.conversations.v1.conversations.create({
      friendlyName: `Test conversation for ${phoneNumber}`,
      // Add the customer as a participant
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
    });
    
    console.log('🧪 Test: Created conversation:', conversation.sid);
    
    // Add the customer participant
    const customerParticipant = await client.conversations.v1
      .conversations(conversation.sid)
      .participants
      .create({
        'messagingBinding.address': phoneNumber,
        'messagingBinding.proxyAddress': process.env.TWILIO_WHATSAPP_NUMBER
      });
    
    console.log('🧪 Test: Added customer participant:', customerParticipant.sid);
    
    // Add an agent participant
    const agentParticipant = await client.conversations.v1
      .conversations(conversation.sid)
      .participants
      .create({
        identity: 'admin_001'
      });
    
    console.log('🧪 Test: Added agent participant:', agentParticipant.sid);
    
    // Send a test message
    const messageResult = await client.conversations.v1
      .conversations(conversation.sid)
      .messages
      .create({
        author: 'admin_001',
        body: message
      });
    
    console.log('🧪 Test: Sent message:', messageResult.sid);
    
    return NextResponse.json({
      success: true,
      conversationSid: conversation.sid,
      customerParticipantSid: customerParticipant.sid,
      agentParticipantSid: agentParticipant.sid,
      messageSid: messageResult.sid,
      message: 'Test conversation created successfully'
    });
    
  } catch (error) {
    console.error('🧪 Test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test conversation endpoint. Use POST with { phoneNumber, message }',
    example: {
      phoneNumber: 'whatsapp:+1234567890',
      message: 'Hello, this is a test message'
    }
  });
}
