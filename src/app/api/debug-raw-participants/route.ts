import { NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-service';

export async function GET() {
  try {
    const client = await getTwilioClient();
    
    // Get all Twilio conversations
    const twilioConversations = await client.conversations.v1.conversations.list({ limit: 10 });
    
    const results = [];
    
    // Process each conversation
    for (const conv of twilioConversations) {
      try {
        // Get participants for this conversation
        const participants = await client.conversations.v1
          .conversations(conv.sid)
          .participants.list();
        
        results.push({
          conversationSid: conv.sid,
          friendlyName: conv.friendlyName,
          participantCount: participants.length,
          participants: participants.map(p => ({
            sid: p.sid,
            identity: p.identity,
            messagingBinding: p.messagingBinding,
            attributes: p.attributes,
            // Show all available properties
            allProperties: Object.keys(p)
          }))
        });
      } catch (error) {
        results.push({
          conversationSid: conv.sid,
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      totalConversations: twilioConversations.length,
      results
    });
    
  } catch (error) {
    console.error('Error debugging raw participants:', error);
    return NextResponse.json(
      { error: 'Failed to debug raw participants', details: error.message },
      { status: 500 }
    );
  }
}
