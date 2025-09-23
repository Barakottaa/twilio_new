// src/app/api/twilio/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from 'twilio';
import twilio from 'twilio';

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are not configured in environment variables.');
  }
  return twilio(accountSid, authToken);
}


// This is your new webhook endpoint
export async function POST(req: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    console.error('Webhook secret is not configured.');
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const signature = req.headers.get('X-Twilio-Signature') || '';
    const url = req.url;
    
    // Convert FormData to a plain object for validation
    const params: { [key: string]: string } = {};
    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        params[key] = value;
      }
    });

    const isValid = validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      signature,
      url,
      params
    );

    if (!isValid) {
      console.warn('Invalid Twilio signature received.');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    const eventType = params.EventType;
    
    if (eventType === 'onMessageAdded') {
      console.log('New message received:', params.Body);
      // Here, you would typically use a real-time service like Firebase Realtime Database
      // or Firestore to push this update to the client.
      // For now, we'll just log it to the server console.
    } else if (eventType === 'onConversationAdded') {
       console.log('New conversation started:', params.ConversationSid);
    }
    

    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
  } catch (error) {
    console.error('Error handling Twilio webhook:', error);
    return NextResponse.json({ message: 'Webhook error' }, { status: 500 });
  }
}
