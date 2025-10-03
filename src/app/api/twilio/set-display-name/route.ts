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
    const { conversationSid, displayName } = await req.json();

    if (!conversationSid || !displayName) {
      return NextResponse.json({
        success: false,
        error: 'conversationSid and displayName are required'
      }, { status: 400 });
    }

    console.log(`🏷️ Setting display name "${displayName}" for conversation ${conversationSid}`);

    // Get participants for this conversation
    const twilioClient = getTwilioClient();
    const participants = await twilioClient.conversations.v1
      .conversations(conversationSid)
      .participants.list();

    // Find the WhatsApp participant (not the agent)
    const whatsappParticipant = participants.find(p => 
      p.messagingBinding?.type === 'whatsapp' && !p.identity?.startsWith('agent-')
    );

    if (!whatsappParticipant) {
      return NextResponse.json({
        success: false,
        error: 'WhatsApp participant not found'
      }, { status: 404 });
    }

    // Parse existing attributes
    const attrs = (() => {
      try { return JSON.parse(whatsappParticipant.attributes || "{}"); }
      catch { return {}; }
    })();

    // Update participant attributes with the new display name
    await twilioClient.conversations.v1
      .conversations(conversationSid)
      .participants(whatsappParticipant.sid)
      .update({
        attributes: JSON.stringify({
          ...attrs,
          display_name: displayName,
          updated_at: new Date().toISOString()
        })
      });

    console.log(`✅ Updated display name to "${displayName}" for participant ${whatsappParticipant.sid}`);

    return NextResponse.json({
      success: true,
      message: `Display name updated to "${displayName}"`,
      participantSid: whatsappParticipant.sid
    });

  } catch (error) {
    console.error('❌ Error setting display name:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
