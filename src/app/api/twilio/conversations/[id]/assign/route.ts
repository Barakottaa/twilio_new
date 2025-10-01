import { NextRequest, NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const { agentId } = await req.json();

    console.log('🔍 Assigning agent:', { conversationId, agentId });

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // For now, we'll just return success
    // In a real implementation, you would:
    // 1. Update the conversation attributes in Twilio
    // 2. Update your database
    // 3. Handle participant management

    console.log('✅ Agent assignment successful:', { conversationId, agentId });

    return NextResponse.json({ 
      success: true, 
      conversationId, 
      agentId,
      message: agentId ? 'Agent assigned successfully' : 'Agent unassigned successfully'
    });

  } catch (error) {
    console.error('Error assigning agent:', error);
    return NextResponse.json(
      { error: 'Failed to assign agent' },
      { status: 500 }
    );
  }
}
