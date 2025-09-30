import { NextRequest, NextResponse } from 'next/server';
import { getTwilioConversations, listConversationsLite } from '@/lib/twilio-service';
import { ConversationService } from '@/lib/conversation-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId') || 'admin_001'; // Default to admin
    const limit = parseInt(searchParams.get('limit') || '20');
    const conversationId = searchParams.get('conversationId'); // For fetching specific conversation
    const messageLimit = parseInt(searchParams.get('messageLimit') || '100'); // For fetching full chat history
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    const since = searchParams.get('since'); // For incremental updates
    const lite = searchParams.get('lite') === '1';
    const after = searchParams.get('after') ?? undefined;

    console.log('Fetching conversations for agent:', agentId, 'limit:', limit, 'conversationId:', conversationId, 'messageLimit:', messageLimit, 'forceRefresh:', forceRefresh, 'lite:', lite);
    
    if (lite) {
      // Fast lightweight list for initial load
      const { items, nextCursor } = await listConversationsLite(limit, after);
      return NextResponse.json({ 
        success: true,
        items, 
        nextCursor,
        count: items.length,
        timestamp: new Date().toISOString()
      });
    }
    
    let conversations;
    
    if (conversationId) {
      // For specific conversation, always fetch from Twilio for accuracy
      conversations = await getTwilioConversations(agentId, limit, conversationId, messageLimit);
    } else {
      // Use optimized local storage service
      conversations = await ConversationService.getConversations(agentId, limit, forceRefresh);
    }
    
    const response = NextResponse.json({
      success: true,
      conversations,
      count: conversations.length,
      cached: !forceRefresh && !conversationId, // Indicate if data is from cache
      timestamp: new Date().toISOString()
    });

    // Add aggressive caching headers for better performance
    if (!forceRefresh && !conversationId) {
      response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
    } else {
      response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      conversations: []
    }, { status: 500 });
  }
}
