import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';
import type { ConversationStatus } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { status } = await request.json();

    // Validate status
    const validStatuses: ConversationStatus[] = ['open', 'closed', 'pending', 'resolved', 'escalated'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    console.log(`🔍 Updating conversation ${conversationId} status to ${status}`);

    // Update status in database
    const db = await getDatabase();
    
    // First, check if the conversation exists in our database
    let conversation = await db.getConversation(conversationId);
    
    if (!conversation) {
      // If conversation doesn't exist, create it with the status
      conversation = await db.createConversation({
        id: conversationId,
        twilio_conversation_sid: conversationId,
        status: status
      });
      console.log('🔍 Created new conversation in database with status:', conversation);
    } else {
      // Check if conversation is being reopened from closed
      const wasClosed = conversation.status === 'closed';
      const isBeingReopened = status === 'open' && wasClosed;
      
      // Update existing conversation status
      conversation = await db.updateConversationStatus(conversationId, status);
      
      // If being closed, unassign the conversation
      if (status === 'closed') {
        await db.updateConversation(conversationId, { agent_id: null });
        console.log('🔍 Conversation closed and unassigned:', conversationId);
      }
      
      // If being reopened, check if it should be marked as new
      if (isBeingReopened) {
        // Only mark as new if it has no agent replies
        const hasAgentReplies = await db.hasAgentReplies(conversationId);
        if (!hasAgentReplies) {
          await db.updateConversation(conversationId, { is_new: 1 });
          console.log('🔍 Conversation reopened and marked as new (no agent replies):', conversationId);
        } else {
          console.log('🔍 Conversation reopened but not marked as new (has agent replies):', conversationId);
        }
      }
      
      console.log('🔍 Updated conversation status in database:', conversation);
    }

    return NextResponse.json({
      success: true,
      conversationId,
      status,
      updatedAt: new Date().toISOString(),
      conversation
    });

  } catch (error) {
    console.error('Error updating conversation status:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation status' },
      { status: 500 }
    );
  }
}