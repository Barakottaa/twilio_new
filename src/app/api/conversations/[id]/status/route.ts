import { NextRequest, NextResponse } from 'next/server';
import { updateConversationStatus } from '@/lib/conversation-service';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { status, closedBy } = await req.json();
    
    if (!status || !['open', 'closed', 'pending', 'resolved', 'escalated'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: open, closed, pending, resolved, escalated' },
        { status: 400 }
      );
    }
    
    const updatedConversation = await updateConversationStatus(resolvedParams.id, status, closedBy);
    
    if (!updatedConversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error('Error updating conversation status:', error);
    return NextResponse.json({ error: 'Failed to update conversation status' }, { status: 500 });
  }
}
