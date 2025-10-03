// API endpoint to manually update participant attributes for existing conversations
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client with proper error handling
let client: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
    }
    
    client = twilio(accountSid, authToken);
  }
  
  return client;
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Starting manual participant update...');
    
    // Get all conversations
    const twilioClient = getTwilioClient();
    const conversations = await twilioClient.conversations.v1.conversations.list({ limit: 50 });
    console.log(`📋 Found ${conversations.length} conversations`);
    
    let updatedCount = 0;
    
    for (const conversation of conversations) {
      console.log(`🔍 Processing conversation: ${conversation.sid}`);
      
      // Get participants for this conversation
      const participants = await twilioClient.conversations.v1.conversations(conversation.sid).participants.list();
      
      for (const participant of participants) {
        // Skip agents
        if (participant.identity?.startsWith('agent-')) {
          continue;
        }
        
        // Check if participant has WhatsApp messaging binding
        if (participant.messagingBinding?.type === 'whatsapp' && participant.messagingBinding?.address) {
          const address = participant.messagingBinding.address;
          const phoneMatch = address.match(/whatsapp:(\+?\d+)/);
          
          if (phoneMatch) {
            const phoneNumber = phoneMatch[1];
            console.log(`📞 Processing WhatsApp participant: ${phoneNumber}`);
            
            // Check current attributes
            const currentAttrs = (() => {
              try {
                return JSON.parse(participant.attributes || '{}');
              } catch {
                return {};
              }
            })();
            
            // If no display_name, set one based on phone number
            if (!currentAttrs.display_name) {
              const displayName = `WhatsApp ${phoneNumber}`;
              const newAttrs = {
                ...currentAttrs,
                display_name: displayName
              };
              
              try {
                await twilioClient.conversations.v1
                  .conversations(conversation.sid)
                  .participants(participant.sid)
                  .update({ 
                    attributes: JSON.stringify(newAttrs) 
                  });
                
                console.log(`✅ Updated participant ${participant.sid} with display name: ${displayName}`);
                updatedCount++;
              } catch (error) {
                console.error(`❌ Failed to update participant ${participant.sid}:`, error);
              }
            } else {
              console.log(`ℹ️ Participant ${participant.sid} already has display name: ${currentAttrs.display_name}`);
            }
          }
        }
      }
    }
    
    console.log(`🎉 Update complete! Updated ${updatedCount} participants`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updatedCount} participants`,
      updatedCount 
    });
    
  } catch (error) {
    console.error('❌ Error updating participants:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
