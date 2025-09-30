
// src/app/api/twilio/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addContact } from '@/lib/contact-mapping';
import { autoCreateOrUpdateContact } from '@/lib/contacts-service';
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
    console.log('🔍 Request URL:', req.url);
    console.log('🔍 Request method:', req.method);
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
    console.log('📋 Body received:', params.Body);
    console.log('📋 Author received:', params.Author);
    console.log('📋 ConversationSid received:', params.ConversationSid);
    console.log('📋 MessageSid received:', params.MessageSid);
    
    // Debug media parameters
    const numMedia = parseInt(params.NumMedia || '0', 10);
    console.log('📸 Media debug - NumMedia:', numMedia);
    if (numMedia > 0) {
      console.log('🎯 Media files detected in webhook!');
      for (let i = 0; i < numMedia; i++) {
        console.log(`  Media ${i}:`, {
          url: params[`MediaUrl${i}`],
          contentType: params[`MediaContentType${i}`]
        });
      }
    } else {
      console.log('❌ No media files in this webhook');
    }
    
    // Handle WhatsApp messages with ProfileName and WaId
    if (eventType === 'onMessageAdded' || eventType === 'onMessageReceived') {
      
      // Extract phone and name from participant data (Conversations webhooks don't include these directly)
      let phone: string | undefined;
      let profileName: string | undefined;
      let waId: string | undefined;
      
      // 1) Quick fallback from the payload itself (sometimes Author/From contains whatsapp:+...)
      if (params.Author?.startsWith("whatsapp:")) {
        phone = params.Author.replace("whatsapp:", "");
      }
      if (params.From?.startsWith("whatsapp:")) {
        phone = params.From.replace("whatsapp:", "");
      }
      
      // 2) Fetch participant to get canonical phone + display name
      if (params.ConversationSid) {
        try {
          const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
          
          // If Twilio didn't pass ParticipantSid (rare), take the non-agent participant
          let participant;
          if (params.ParticipantSid) {
            participant = await client.conversations.v1
              .conversations(params.ConversationSid)
              .participants(params.ParticipantSid)
              .fetch();
          } else {
            const participants = await client.conversations.v1
              .conversations(params.ConversationSid)
              .participants
              .list({ limit: 10 });
            participant = participants.find(p => !(p.identity && p.identity.startsWith("agent:"))) || participants[0];
          }
          
          // phone / wa id
          const addr = participant?.messagingBinding?.address; // "whatsapp:+20123..."
          if (!phone && addr?.startsWith("whatsapp:")) {
            phone = addr.replace("whatsapp:", "");
          }
          
          // profile name
          try {
            const attrs = participant?.attributes ? JSON.parse(participant.attributes) : {};
            profileName = attrs.display_name || attrs.profile_name || profileName;
          } catch {}
          
          console.log('🔍 Participant details:', {
            phone,
            profileName,
            messagingBinding: participant?.messagingBinding,
            attributes: participant?.attributes
          });
          
        } catch (error) {
          console.error('❌ Error fetching participant:', error);
        }
      }
      
      console.log('📨 New message received via webhook:', {
        body: params.Body,
        author: params.Author,
        conversationSid: params.ConversationSid,
        messageSid: params.MessageSid,
        profileName: profileName || params.ProfileName,
        waId: waId || params.WaId,
        phone: phone,
        from: params.From,
        numMedia: numMedia
      });
      
      // Process media messages (Option 1: Twilio-only storage)
      const mediaMessages = [];
      if (numMedia > 0) {
        console.log('📸 Processing media message with', numMedia, 'media files');
        
        for (let i = 0; i < numMedia; i++) {
          const mediaUrl = params[`MediaUrl${i}`];
          const contentType = params[`MediaContentType${i}`];
          
          if (mediaUrl && contentType) {
            const mediaType = getMediaTypeFromContentType(contentType);
            
            mediaMessages.push({
              mediaType,
              mediaUrl,
              mediaContentType: contentType,
              mediaFileName: extractFileNameFromUrl(mediaUrl),
              mediaCaption: params.Body || undefined
            });
            
            // For PDFs and documents, ensure we have a caption or filename
            if (mediaType === 'document' && !params.Body) {
              mediaMessages[mediaMessages.length - 1].mediaCaption = `Document: ${extractFileNameFromUrl(mediaUrl)}`;
            }
            
            console.log('📁 Media file detected:', {
              type: mediaType,
              url: mediaUrl,
              contentType: contentType
            });
          }
        }
      }
      
      // Extract WhatsApp contact information if available
      if (phone && profileName) {
        console.log('👤 WhatsApp contact info:', { profileName, phone, waId });
        
        // Generate avatar using UI Avatars service
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=random`;
        
        // Store contact in our in-memory mapping system (for backward compatibility)
        addContact(phone, profileName, avatar);
        
        // Auto-create or update contact in database
        try {
          const dbContact = await autoCreateOrUpdateContact({
            phoneNumber: phone,
            name: profileName,
            waId: waId || phone.replace('+', ''),
            profileName
          });
          
          if (dbContact) {
            console.log('✅ WhatsApp contact stored in database:', { 
              id: dbContact.id, 
              phoneNumber: phone, 
              name: dbContact.name 
            });
          }
        } catch (error) {
          console.error('❌ Error storing contact in database:', error);
        }
        
        console.log('✅ WhatsApp contact stored in memory:', { phone, profileName, avatar });
      } else if (phone) {
        // Fallback: create contact with phone number only
        console.log('👤 Creating contact with phone only:', { phone });
        
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(phone)}&background=random`;
        addContact(phone, phone, avatar);
        
        try {
          const dbContact = await autoCreateOrUpdateContact({
            phoneNumber: phone,
            name: phone,
            waId: phone.replace('+', ''),
            profileName: phone
          });
          
          if (dbContact) {
            console.log('✅ Contact created/updated in database (phone only):', dbContact);
          }
        } catch (error) {
          console.error('❌ Error creating/updating contact (phone only):', error);
        }
        
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
      } else if (params.From) {
        // Handle cases where we don't have ProfileName but have a phone number
        const from = params.From; // e.g., "whatsapp:+201234567890"
        const phoneNumber = from.replace('whatsapp:', '');
        
        console.log('📱 WhatsApp message without ProfileName, phone:', phoneNumber);
        
        // Auto-create or update contact in database with phone number only
        try {
          const dbContact = await autoCreateOrUpdateContact({
            phoneNumber,
            name: `WhatsApp ${phoneNumber}`,
            waId: params.WaId
          });
          
          if (dbContact) {
            console.log('✅ WhatsApp contact created from phone only:', { 
              id: dbContact.id, 
              phoneNumber, 
              name: dbContact.name 
            });
          }
        } catch (error) {
          console.error('❌ Error storing contact from phone only:', error);
        }
      }
      
      // Invalidate cache for this conversation
      await invalidateConversationCache(params.ConversationSid);
      
      // Broadcast the new message to all connected clients
      const broadcastData = {
        conversationSid: params.ConversationSid,
        messageSid: params.MessageSid,
        body: params.Body,
        author: params.Author,
        dateCreated: params.DateCreated,
        index: params.Index,
        // Include media information (Option 1: Twilio-only storage)
        numMedia: numMedia,
        mediaMessages: mediaMessages,
        // New media array format for better compatibility
        media: mediaMessages.map(msg => ({
          url: msg.mediaUrl,
          contentType: msg.mediaContentType,
          filename: msg.mediaFileName
        })),
        // Include contact information for new numbers
        profileName: profileName || params.ProfileName,
        waId: waId || params.WaId,
        phone: phone,
        from: params.From
      };
      
      console.log('📡 Broadcasting message data:', broadcastData);
      broadcastMessage('newMessage', broadcastData);
      
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

// Helper functions for media processing (Option 1: Twilio-only storage)
function getMediaTypeFromContentType(contentType: string): 'image' | 'video' | 'audio' | 'document' {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  return 'document';
}

function extractFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'media';
    return filename;
  } catch {
    return 'media';
  }
}
