import { NextRequest, NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-service';

export async function GET(req: NextRequest) {
  try {
    const client = await getTwilioClient();
    
    // Fetch ALL conversations from Twilio using pagination
    console.log('🔍 Fetching ALL conversations from Twilio...');
    let allConversations: any[] = [];
    let page = await client.conversations.v1.conversations.page({ limit: 50 });
    
    // Collect all conversations across pages
    while (page.instances.length > 0) {
      allConversations.push(...page.instances);
      console.log(`📄 Fetched page with ${page.instances.length} conversations. Total so far: ${allConversations.length}`);
      
      if (page.nextPageUrl) {
        // Extract page token from nextPageUrl
        const url = new URL(page.nextPageUrl);
        const pageToken = url.searchParams.get('PageToken');
        if (pageToken) {
          page = await client.conversations.v1.conversations.page({ 
            limit: 50, 
            pageToken: pageToken 
          });
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    console.log(`📊 Found ${allConversations.length} total conversations in Twilio`);
    
    // Log basic info about each conversation
    allConversations.forEach((convo, index) => {
      console.log(`📋 Conversation ${index + 1}: ${convo.sid} - ${convo.friendlyName || 'No name'} - Created: ${convo.dateCreated}`);
    });
    
    // Get detailed info for each conversation
    const detailedConversations = await Promise.all(
      allConversations.map(async (convo: any) => {
        try {
          // Get participants
          const participants = await client.conversations.v1
            .conversations(convo.sid)
            .participants.list();
          
          // Get message count
          const messages = await client.conversations.v1
            .conversations(convo.sid)
            .messages.list({ limit: 1 });
          
          // Find customer participant
          const customerParticipant = participants.find(p => {
            if (!p.identity) {
              return p.messagingBinding && p.messagingBinding.type === 'whatsapp';
            }
            return !p.identity.startsWith('agent-') && !p.identity.startsWith('admin-');
          });
          
          let customerName = 'Unknown';
          if (customerParticipant) {
            try {
              const attributes = customerParticipant.attributes ? 
                JSON.parse(customerParticipant.attributes) : {};
              customerName = attributes.display_name || 
                            customerParticipant.identity || 
                            'Unknown';
            } catch {
              customerName = customerParticipant.identity || 'Unknown';
            }
          }
          
          return {
            id: convo.sid,
            friendlyName: convo.friendlyName,
            customerName,
            participantCount: participants.length,
            hasMessages: messages.length > 0,
            dateCreated: convo.dateCreated?.toISOString(),
            dateUpdated: convo.dateUpdated?.toISOString(),
            participants: participants.map(p => ({
              identity: p.identity,
              messagingBinding: p.messagingBinding,
              attributes: p.attributes
            }))
          };
        } catch (error) {
          console.error(`Error processing conversation ${convo.sid}:`, error);
          return {
            id: convo.sid,
            friendlyName: convo.friendlyName,
            customerName: 'Error',
            participantCount: 0,
            hasMessages: false,
            dateCreated: convo.dateCreated?.toISOString(),
            dateUpdated: convo.dateUpdated?.toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
    
    // Sort by date updated (most recent first)
    detailedConversations.sort((a, b) => 
      new Date(b.dateUpdated || 0).getTime() - new Date(a.dateUpdated || 0).getTime()
    );
    
    return NextResponse.json({
      success: true,
      totalConversations: allConversations.length,
      conversations: detailedConversations,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching Twilio conversations:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      conversations: []
    }, { status: 500 });
  }
}
