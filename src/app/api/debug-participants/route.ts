import { NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-service';

export async function GET() {
  try {
    const client = await getTwilioClient();
    
    // Get all Twilio conversations
    const twilioConversations = await client.conversations.v1.conversations.list({ limit: 10 });
    console.log('📞 Found Twilio conversations:', twilioConversations.length);
    
    const conversationDetails = [];
    
    // Process each conversation
    for (const conv of twilioConversations) {
      try {
        // Get participants for this conversation
        const participants = await client.conversations.v1
          .conversations(conv.sid)
          .participants.list();
        
        // Find customer participant
        const customerParticipant = participants.find(p => {
          if (!p.identity) {
            return p.messagingBinding && p.messagingBinding.type === 'whatsapp';
          }
          return !p.identity.startsWith('agent-') && !p.identity.startsWith('admin-');
        });
        
        const agentParticipant = participants.find(p => 
          p.identity && (p.identity.startsWith('agent-') || p.identity.startsWith('admin-'))
        );
        
        conversationDetails.push({
          conversationSid: conv.sid,
          friendlyName: conv.friendlyName,
          participantCount: participants.length,
          customerParticipant: customerParticipant ? {
            identity: customerParticipant.identity,
            messagingBinding: customerParticipant.messagingBinding,
            attributes: customerParticipant.attributes,
            // Extract phone number attempts
            phoneFromAddress: customerParticipant.messagingBinding?.address?.replace('whatsapp:', ''),
            phoneFromProxy: customerParticipant.messagingBinding?.proxy_address?.replace('whatsapp:', ''),
            phoneFromIdentity: customerParticipant.identity?.replace('whatsapp:', ''),
            // Raw data for debugging
            rawMessagingBinding: customerParticipant.messagingBinding,
            rawAttributes: customerParticipant.attributes
          } : null,
          agentParticipant: agentParticipant ? {
            identity: agentParticipant.identity,
            attributes: agentParticipant.attributes
          } : null,
          allParticipants: participants.map(p => ({
            identity: p.identity,
            messagingBinding: p.messagingBinding,
            attributes: p.attributes,
            // Show all messagingBinding properties
            messagingBindingKeys: p.messagingBinding ? Object.keys(p.messagingBinding) : [],
            messagingBindingValues: p.messagingBinding ? Object.values(p.messagingBinding) : []
          }))
        });
      } catch (error) {
        conversationDetails.push({
          conversationSid: conv.sid,
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      totalConversations: twilioConversations.length,
      conversationDetails
    });
    
  } catch (error) {
    console.error('Error debugging participants:', error);
    return NextResponse.json(
      { error: 'Failed to debug participants', details: error.message },
      { status: 500 }
    );
  }
}
