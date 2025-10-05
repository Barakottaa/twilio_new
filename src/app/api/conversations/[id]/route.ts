import { NextRequest, NextResponse } from 'next/server';
import { getTwilioConversations } from '@/lib/twilio-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const agentId = 'admin_001'; // Default to admin
    
    // Get specific conversation by ID
    const conversations = await getTwilioConversations(agentId, 1, resolvedParams.id);
    const conversation = conversations[0];
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}
