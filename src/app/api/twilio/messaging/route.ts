// Next.js App Router — Twilio Programmable Messaging inbound webhook
import Twilio from "twilio";
import { broadcastMessage } from '@/lib/sse-broadcast';
import { invalidateConversationCache } from '@/lib/twilio-service';

// Initialize Twilio client with proper error handling
let client: Twilio.Twilio | null = null;

function getTwilioClient(): Twilio.Twilio {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
    }
    
    client = Twilio(accountSid, authToken);
  }
  
  return client;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const waId = form.get("WaId")?.toString();               // e.g. "201234567890"
    const profileName = form.get("ProfileName")?.toString() || "WhatsApp user";

    console.log('📨 Messaging webhook received:', { waId, profileName });

    if (waId) {
      const address = `whatsapp:+${waId}`;
      console.log('🔍 Looking up conversations for address:', address);
      
      const twilioClient = getTwilioClient();
      const pcs = await twilioClient.conversations.v1.participantConversations.list({ address, limit: 20 });
      console.log('📋 Found participant conversations:', pcs.length);
      
      const attrs = JSON.stringify({ display_name: profileName });
      console.log('🏷️ Setting display name:', profileName);

      await Promise.all(
        pcs.map(pc => {
          console.log('🔄 Updating participant:', pc.participantSid, 'in conversation:', pc.conversationSid);
          return twilioClient.conversations.v1
            .conversations(pc.conversationSid)
            .participants(pc.participantSid)
            .update({ attributes: attrs });
        })
      );
      
      console.log('✅ Successfully updated participant attributes for:', profileName);
      
      // Broadcast new message to all connected clients via SSE
      if (pcs.length > 0) {
        const conversationSid = pcs[0].conversationSid;
        
        // Invalidate cache for this conversation
        await invalidateConversationCache(conversationSid);
        
        // Try to get the latest message from the conversation
        try {
          const messages = await twilioClient.conversations.v1
            .conversations(conversationSid)
            .messages.list({ limit: 5 }); // Get more messages to find the actual latest one
          
          if (messages.length > 0) {
            // Find the most recent message (messages are sorted by dateCreated desc)
            const latestMessage = messages[0];
            console.log('📨 Found latest message:', latestMessage.body);
            console.log('📨 Message timestamp:', latestMessage.dateCreated);
            console.log('📨 Message author:', latestMessage.author);
            
            // Check if this is a very recent message (within last 30 seconds)
            const messageTime = new Date(latestMessage.dateCreated);
            const now = new Date();
            const timeDiff = now.getTime() - messageTime.getTime();
            const isRecent = timeDiff < 30000; // 30 seconds
            
            console.log('📨 Message age:', timeDiff / 1000, 'seconds, isRecent:', isRecent);
            
            if (isRecent) {
              // Broadcast the actual message
              broadcastMessage('newMessage', {
                conversationSid: conversationSid,
                messageSid: latestMessage.sid,
                body: latestMessage.body || 'New message received',
                author: latestMessage.author || `whatsapp:+${waId}`,
                dateCreated: latestMessage.dateCreated?.toISOString() || new Date().toISOString(),
                index: latestMessage.index?.toString() || '0'
              });
              
              console.log('📡 Broadcasted recent message via SSE for conversation:', conversationSid);
            } else {
              // Message is too old, broadcast a generic notification
              broadcastMessage('newMessage', {
                conversationSid: conversationSid,
                messageSid: `msg-${Date.now()}`,
                body: 'New message received',
                author: `whatsapp:+${waId}`,
                dateCreated: new Date().toISOString(),
                index: '0'
              });
              
              console.log('📡 Broadcasted generic message via SSE for conversation:', conversationSid);
            }
          } else {
            // Fallback to generic message
            broadcastMessage('newMessage', {
              conversationSid: conversationSid,
              messageSid: `msg-${Date.now()}`,
              body: 'New message received',
              author: `whatsapp:+${waId}`,
              dateCreated: new Date().toISOString(),
              index: '0'
            });
            
            console.log('📡 Broadcasted generic message via SSE for conversation:', conversationSid);
          }
        } catch (error) {
          console.error('❌ Error fetching latest message:', error);
          
          // Fallback to generic message
          broadcastMessage('newMessage', {
            conversationSid: conversationSid,
            messageSid: `msg-${Date.now()}`,
            body: 'New message received',
            author: `whatsapp:+${waId}`,
            dateCreated: new Date().toISOString(),
            index: '0'
          });
          
          console.log('📡 Broadcasted fallback message via SSE for conversation:', conversationSid);
        }
      }
    }

    return new Response("<Response/>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("❌ Messaging webhook error:", error);
    return new Response("<Response/>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
