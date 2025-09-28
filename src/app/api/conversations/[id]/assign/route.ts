import { NextRequest, NextResponse } from 'next/server';
import { assignConversation } from '@/lib/conversation-service';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { agentId } = await req.json();
    
    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }
    
    const updatedConversation = await assignConversation(resolvedParams.id, agentId);
    
    if (!updatedConversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error('Error assigning conversation:', error);
    return NextResponse.json({ error: 'Failed to assign conversation' }, { status: 500 });
  }
}
