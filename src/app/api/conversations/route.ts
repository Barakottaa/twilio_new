import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllConversations, 
  getConversationsByStatus, 
  getConversationsByAgent,
  getConversationsByPriority,
  getConversationStats,
  searchConversations
} from '@/lib/conversation-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const agentId = searchParams.get('agentId');
    const priority = searchParams.get('priority');
    const stats = searchParams.get('stats') === 'true';
    const search = searchParams.get('search');
    
    if (stats) {
      const conversationStats = await getConversationStats();
      return NextResponse.json(conversationStats);
    }
    
    if (search) {
      const conversations = await searchConversations(search);
      return NextResponse.json(conversations);
    }
    
    if (status) {
      const conversations = await getConversationsByStatus(status as any);
      return NextResponse.json(conversations);
    }
    
    if (agentId) {
      const conversations = await getConversationsByAgent(agentId);
      return NextResponse.json(conversations);
    }
    
    if (priority) {
      const conversations = await getConversationsByPriority(priority as any);
      return NextResponse.json(conversations);
    }
    
    const conversations = await getAllConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
