import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const { isPinned } = await request.json();

    if (typeof isPinned !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid isPinned value. Must be boolean.' },
        { status: 400 }
      );
    }

    console.log(`🔍 Updating conversation ${conversationId} pin status to ${isPinned}`);

    // Update pin status in database
    const db = await getDatabase();
    
    // First, check if the conversation exists in our database
    let conversation = await db.getConversation(conversationId);
    
    if (!conversation) {
      // If conversation doesn't exist, create it with the pin status
      conversation = await db.createConversation({
        id: conversationId,
        twilio_conversation_sid: conversationId,
        is_pinned: isPinned ? 1 : 0
      });
      console.log('🔍 Created new conversation in database with pin status:', conversation);
    } else {
      // Update existing conversation pin status
      conversation = await db.updateConversationPinStatus(conversationId, isPinned);
      console.log('🔍 Updated conversation pin status in database:', conversation);
    }

    return NextResponse.json({
      success: true,
      conversationId,
      isPinned,
      updatedAt: new Date().toISOString(),
      conversation
    });

  } catch (error) {
    console.error('Error updating conversation pin status:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation pin status' },
      { status: 500 }
    );
  }
}
