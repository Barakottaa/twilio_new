
// src/app/api/twilio/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addContact } from '@/lib/contact-mapping';
import { broadcastMessage } from '@/lib/sse-broadcast';
import { invalidateConversationCache } from '@/lib/twilio-service';
import twilio from 'twilio';

// Test GET endpoint to verify webhook is reachable
export async function GET() {
  console.log('✅ Webhook GET endpoint called - webhook is reachable');
  return new Response("Webhook endpoint is working", { status: 200 });
}

// This is your new webhook endpoint
export async function POST(req: NextRequest) {
  console.log('🚨 WEBHOOK CALLED - Raw request received');
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
    const isValid = twilio.validateRequest(authToken, signature, fullUrl, body as any);
    
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
    console.log('📋 All webhook parameters:', Object.keys(params).map(key => `${key}: ${params[key]}`).join(', '));
    console.log('📋 ProfileName received:', params.ProfileName);
    console.log('📋 WaId received:', params.WaId);
    console.log('📋 From received:', params.From);
    
    // Handle WhatsApp messages with ProfileName and WaId
    if (eventType === 'onMessageAdded' || eventType === 'onMessageReceived') {
      console.log('📨 New message received via webhook:', {
        body: params.Body,
        author: params.Author,
        conversationSid: params.ConversationSid,
        messageSid: params.MessageSid,
        profileName: params.ProfileName,
        waId: params.WaId,
        from: params.From
      });
      
      // Extract WhatsApp contact information if available
      if (params.ProfileName && params.WaId) {
        const profileName = params.ProfileName;
        const waId = params.WaId;
        const from = params.From; // e.g., "whatsapp:+201234567890"
        
        console.log('👤 WhatsApp contact info:', { profileName, waId, from });
        
        // Format phone number (remove whatsapp: prefix if present)
        const phoneNumber = from.replace('whatsapp:', '');
        
        // Generate avatar using UI Avatars service
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=random`;
        
        // Store contact in our mapping system
        addContact(phoneNumber, profileName, avatar);
        
        console.log('✅ WhatsApp contact stored:', { phoneNumber, profileName, avatar });
        
        // Also update the participant attributes in the conversation
        if (params.ConversationSid) {
          try {
            const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
            
            // Find the participant by their WhatsApp address
            const participants = await twilioClient.conversations.v1
              .conversations(params.ConversationSid)
              .participants.list();
            
            const participant = participants.find(p => 
              p.messagingBinding?.address === from
            );
            
            if (participant) {
              // Update participant attributes with the profile name
              await twilioClient.conversations.v1
                .conversations(params.ConversationSid)
                .participants(participant.sid)
                .update({
                  attributes: JSON.stringify({
                    display_name: profileName,
                    phone_number: phoneNumber,
                    wa_id: waId
                  })
                });
              
              console.log('✅ Updated participant attributes with profile name:', profileName);
            }
          } catch (error) {
            console.error('❌ Error updating participant attributes:', error);
          }
        }
      }
      
      // Invalidate cache for this conversation
      await invalidateConversationCache(params.ConversationSid);
      
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
    
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error('Error handling Twilio webhook:', error);
    return new Response("error", { status: 500 });
  }
}
