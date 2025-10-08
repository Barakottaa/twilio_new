import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { agentId } = await req.json();

    console.log('🔍 Assigning agent:', { conversationId, agentId });

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Store the assignment in the database
    const db = await getDatabase();
    
    // First, check if the conversation exists in our database
    let conversation = await db.getConversation(conversationId);
    
    if (!conversation) {
      // If conversation doesn't exist, create it
      conversation = await db.createConversation({
        id: conversationId,
        twilio_conversation_sid: conversationId, // Using conversationId as Twilio SID for now
        agent_id: agentId
      });
      console.log('🔍 Created new conversation in database:', conversation);
    } else {
      // Update existing conversation
      conversation = await db.assignConversationToAgent(conversationId, agentId);
      console.log('🔍 Updated conversation assignment in database:', conversation);
    }

    console.log('✅ Agent assignment successful:', { conversationId, agentId });

    return NextResponse.json({ 
      success: true, 
      conversationId, 
      agentId,
      conversation,
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
