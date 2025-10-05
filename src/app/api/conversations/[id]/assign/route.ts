import { NextRequest, NextResponse } from 'next/server';
import { reassignTwilioConversation } from '@/lib/twilio-service';

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
    
    // Use the existing Twilio service to reassign conversation
    await reassignTwilioConversation(resolvedParams.id, agentId);
    
    return NextResponse.json({
      success: true,
      message: 'Conversation assigned successfully',
      conversationId: resolvedParams.id,
      agentId
    });
  } catch (error) {
    console.error('Error assigning conversation:', error);
    return NextResponse.json({ error: 'Failed to assign conversation' }, { status: 500 });
  }
}
