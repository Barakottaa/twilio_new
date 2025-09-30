import { NextRequest, NextResponse } from 'next/server';
import { getTwilioConversations } from '@/lib/twilio-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId') || 'admin_001'; // Default to admin
    const limit = parseInt(searchParams.get('limit') || '20');
    const conversationId = searchParams.get('conversationId'); // For fetching specific conversation
    const messageLimit = parseInt(searchParams.get('messageLimit') || '100'); // For fetching full chat history

    console.log('Fetching Twilio conversations for agent:', agentId, 'limit:', limit, 'conversationId:', conversationId, 'messageLimit:', messageLimit);
    
    const conversations = await getTwilioConversations(agentId, limit, conversationId, messageLimit);
    
    const response = NextResponse.json({
      success: true,
      conversations,
      count: conversations.length
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('Error fetching Twilio conversations:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      conversations: []
    }, { status: 500 });
  }
}
