import { NextRequest, NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-service';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? 30);
    const after = url.searchParams.get("after") ?? undefined;
    const loggedInAgentId = url.searchParams.get("agentId");
    
    if (!loggedInAgentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }

    const twilioClient = getTwilioClient();
    
    // Fetch conversations with pagination
    const listOpts: any = { limit: Math.min(limit, 50) };
    if (after) {
      listOpts.pageToken = after;
    }
    
    const conversations = await twilioClient.conversations.v1.conversations.list(listOpts);
    
    // Process conversations in parallel for metadata only
    const conversationPromises = conversations.map(async (convo) => {
      try {
        // Get participants and last message in parallel
        const [participants, lastMessages] = await Promise.all([
          twilioClient.conversations.v1.conversations(convo.sid).participants.list({ limit: 10 }),
          twilioClient.conversations.v1.conversations(convo.sid).messages.list({ limit: 1 })
        ]);
        
        const customerParticipant = participants.find(p => !p.identity?.startsWith('agent-'));
        const agentParticipant = participants.find(p => p.identity?.startsWith('agent-'));
        
        if (!customerParticipant) {
          return null;
        }
        
        // Extract customer info from participant attributes
        let customerName = 'Unknown Customer';
        let customerAvatar = 'https://ui-avatars.com/api/?name=Unknown&background=random';
        
        if (customerParticipant.attributes) {
          try {
            const attrs = JSON.parse(customerParticipant.attributes);
            if (attrs.display_name) customerName = attrs.display_name;
            if (attrs.phone_number) {
              customerAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=random`;
            }
          } catch (e) {
            // Use defaults
          }
        }
        
        // Get last message preview
        let lastMessagePreview = '';
        let lastMessageTime = convo.dateUpdated || convo.dateCreated;
        
        if (lastMessages.length > 0) {
          const lastMsg = lastMessages[0];
          lastMessagePreview = lastMsg.body || '[Media]';
          lastMessageTime = lastMsg.dateCreated;
        }
        
        return {
          id: convo.sid,
          title: customerName,
          lastMessagePreview,
          unreadCount: 0, // Simplified for now
          createdAt: convo.dateCreated ? new Date(convo.dateCreated).toISOString() : new Date().toISOString(),
          updatedAt: lastMessageTime ? new Date(lastMessageTime).toISOString() : new Date().toISOString(),
          customerId: customerParticipant.identity || 'unknown',
          agentId: agentParticipant?.identity || loggedInAgentId,
        };
      } catch (error) {
        console.error('Error processing conversation:', convo.sid, error);
        return null;
      }
    });
    
    const results = await Promise.all(conversationPromises);
    const items = results.filter(item => item !== null);
    
    // Get next cursor for pagination
    const nextCursor = conversations.length === limit ? 
      conversations[conversations.length - 1].sid : null;
    
    return NextResponse.json({
      items,
      nextCursor,
      hasMore: conversations.length === limit
    });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
