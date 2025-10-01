import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';
import { getTwilioClient } from '@/lib/twilio-service';

export async function GET() {
  try {
    const db = await getDatabase();
    
    // Get all contacts from database
    const contacts = await db.getAllContacts();
    console.log('📋 All contacts in database:', contacts);
    
    // Get all conversations from database
    const conversations = await db.getAllConversations();
    console.log('💬 All conversations in database:', conversations);
    
    // Get conversations from Twilio
    const client = await getTwilioClient();
    const twilioConversations = await client.conversations.v1.conversations.list({ limit: 10 });
    console.log('📞 Twilio conversations:', twilioConversations.map(c => ({ sid: c.sid, friendlyName: c.friendlyName })));
    
    // For each Twilio conversation, check participants
    const conversationDetails = await Promise.all(
      twilioConversations.map(async (conv) => {
        try {
          const participants = await client.conversations.v1.conversations(conv.sid).participants.list();
          const customerParticipant = participants.find(p => !p.identity?.startsWith('agent-'));
          const agentParticipant = participants.find(p => p.identity?.startsWith('agent-'));
          
          return {
            conversationSid: conv.sid,
            friendlyName: conv.friendlyName,
            customerParticipant: customerParticipant ? {
              identity: customerParticipant.identity,
              messagingBinding: customerParticipant.messagingBinding,
              attributes: customerParticipant.attributes
            } : null,
            agentParticipant: agentParticipant ? {
              identity: agentParticipant.identity,
              attributes: agentParticipant.attributes
            } : null,
            participantCount: participants.length
          };
        } catch (error) {
          return {
            conversationSid: conv.sid,
            error: error.message
          };
        }
      })
    );
    
    return NextResponse.json({
      databaseContacts: contacts,
      databaseConversations: conversations,
      twilioConversations: twilioConversations.map(c => ({ sid: c.sid, friendlyName: c.friendlyName })),
      conversationDetails,
      summary: {
        totalContacts: contacts.length,
        totalDatabaseConversations: conversations.length,
        totalTwilioConversations: twilioConversations.length
      }
    });
    
  } catch (error) {
    console.error('Error debugging contacts:', error);
    return NextResponse.json(
      { error: 'Failed to debug contacts', details: error.message },
      { status: 500 }
    );
  }
}
