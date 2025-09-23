
// src/app/api/twilio/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

// This is your new webhook endpoint
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Convert FormData to a plain object
    const params: { [key: string]: string } = {};
    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        params[key] = value;
      }
    });

    const eventType = params.EventType;
    
    // NOTE: Real-time updates are not yet implemented.
    // This webhook currently just logs incoming events to the server console.
    // You will need to refresh the app to see new conversations.
    if (eventType === 'onMessageAdded') {
      console.log('New message received via webhook:', params.Body);
    } else if (eventType === 'onConversationAdded') {
       console.log('New conversation started via webhook:', params.ConversationSid);
    }
    
    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
  } catch (error) {
    console.error('Error handling Twilio webhook:', error);
    return NextResponse.json({ message: 'Webhook error' }, { status: 500 });
  }
}
