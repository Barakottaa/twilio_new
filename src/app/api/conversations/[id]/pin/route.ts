import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { isPinned } = await request.json();

    console.log('🔍 Pin route called with:', { conversationId, isPinned, type: typeof isPinned });

    if (typeof isPinned !== 'boolean') {
      console.log('❌ Invalid isPinned type:', typeof isPinned);
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
    console.log('🔍 Current conversation in database:', conversation);
    
    if (!conversation) {
      // If conversation doesn't exist, create it with the pin status
      const newConversationData = {
        id: conversationId,
        twilio_conversation_sid: conversationId,
        is_pinned: isPinned ? 1 : 0
      };
      console.log('🔍 Creating new conversation with data:', newConversationData);
      conversation = await db.createConversation(newConversationData);
      console.log('🔍 Created new conversation in database with pin status:', conversation);
    } else {
      // Update existing conversation pin status
      console.log('🔍 Updating existing conversation pin status from', conversation.is_pinned, 'to', isPinned ? 1 : 0);
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
    console.error('❌ Error updating conversation pin status:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to update conversation pin status',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
