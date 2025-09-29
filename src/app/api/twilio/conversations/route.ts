import { NextRequest, NextResponse } from 'next/server';
import { getTwilioConversations } from '@/lib/twilio-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId') || 'admin_001'; // Default to admin
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log('Fetching Twilio conversations for agent:', agentId, 'limit:', limit);
    
    const conversations = await getTwilioConversations(agentId, limit);
    
    return NextResponse.json({
      success: true,
      conversations,
      count: conversations.length
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
