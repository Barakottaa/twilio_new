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
    console.log('🔄 Starting WhatsApp name update for all conversations...');
    
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
        // Only process WhatsApp participants (not agents)
        if (participant.messagingBinding?.type === 'whatsapp' && !participant.identity?.startsWith('agent-')) {
          const address = participant.messagingBinding.address;
          const phoneNumber = address?.replace('whatsapp:', '');
          
          if (phoneNumber) {
            // Parse existing attributes
            const attrs = (() => {
              try { return JSON.parse(participant.attributes || "{}"); }
              catch { return {}; }
            })();
            
            // If no display_name or it's just the phone number, try to get a better name
            if (!attrs.display_name || attrs.display_name === phoneNumber) {
              // For now, we'll use a formatted version of the phone number
              // In a real app, you might want to use a contacts API or database
              const formattedName = formatPhoneNumber(phoneNumber);
              
              console.log(`🏷️ Updating participant ${participant.sid} with name: ${formattedName}`);
              
              await twilioClient.conversations.v1
                .conversations(conversation.sid)
                .participants(participant.sid)
                .update({
                  attributes: JSON.stringify({
                    ...attrs,
                    display_name: formattedName,
                    phone_number: phoneNumber,
                    updated_at: new Date().toISOString()
                  })
                });
              
              updatedCount++;
            }
          }
        }
      }
    }
    
    console.log(`✅ Updated ${updatedCount} participants with WhatsApp names`);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} participants with WhatsApp names`,
      updatedCount
    });
  } catch (error) {
    console.error('❌ Error updating WhatsApp names:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function formatPhoneNumber(phoneNumber: string): string {
  // Remove the + and format the number nicely
  const cleaned = phoneNumber.replace(/^\+/, '');
  
  // Format based on length (basic formatting)
  if (cleaned.length === 12 && cleaned.startsWith('20')) {
    // Egyptian number: +201234567890 -> +20 10 1234 5678
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US number: +12345678901 -> +1 (234) 567-8901
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else {
    // Default formatting
    return `+${cleaned}`;
  }
}
