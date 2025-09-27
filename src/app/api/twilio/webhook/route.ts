
// src/app/api/twilio/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { broadcastMessage } from '../events/route';
import twilio from 'twilio';

// This is your new webhook endpoint
export async function POST(req: NextRequest) {
  try {
    // Get the webhook URL for validation
    const webhookUrl = new URL(req.url);
    const fullUrl = `${webhookUrl.protocol}//${webhookUrl.host}${webhookUrl.pathname}`;
    
    // Get the signature from headers
    const signature = req.headers.get('x-twilio-signature');
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!signature || !authToken) {
      console.error('Missing signature or auth token for webhook validation');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the raw body for signature validation
    const body = await req.text();
    
    // Validate the webhook signature
    const isValid = twilio.validateRequest(authToken, signature, fullUrl, body);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }
    
    // Parse the validated form data
    const formData = new URLSearchParams(body);
    const params: { [key: string]: string } = {};
    formData.forEach((value, key) => {
      params[key] = value;
    });

    const eventType = params.EventType;
    
    console.log('✅ Verified Twilio webhook received:', { eventType, params });
    
    if (eventType === 'onMessageAdded') {
      console.log('📨 New message received via webhook:', {
        body: params.Body,
        author: params.Author,
        conversationSid: params.ConversationSid,
        messageSid: params.MessageSid
      });
      
      // Broadcast the new message to all connected clients
      broadcastMessage('newMessage', {
        conversationSid: params.ConversationSid,
        messageSid: params.MessageSid,
        body: params.Body,
        author: params.Author,
        dateCreated: params.DateCreated,
        index: params.Index
      });
      
    } else if (eventType === 'onConversationAdded') {
      console.log('💬 New conversation started via webhook:', params.ConversationSid);
      
      // Broadcast the new conversation to all connected clients
      broadcastMessage('newConversation', {
        conversationSid: params.ConversationSid,
        friendlyName: params.FriendlyName,
        dateCreated: params.DateCreated
      });
    } else {
      console.log('ℹ️ Other webhook event:', eventType);
    }
    
    return NextResponse.json({ message: 'Webhook received and verified' }, { status: 200 });
  } catch (error) {
    console.error('Error handling Twilio webhook:', error);
    return NextResponse.json({ message: 'Webhook error' }, { status: 500 });
  }
}
