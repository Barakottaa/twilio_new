import { NextRequest, NextResponse } from 'next/server';
import { updateConversationPriority } from '@/lib/conversation-service';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { priority } = await req.json();
    
    if (!priority || !['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be one of: low, medium, high, urgent' },
        { status: 400 }
      );
    }
    
    const updatedConversation = await updateConversationPriority(params.id, priority);
    
    if (!updatedConversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error('Error updating conversation priority:', error);
    return NextResponse.json({ error: 'Failed to update conversation priority' }, { status: 500 });
  }
}
