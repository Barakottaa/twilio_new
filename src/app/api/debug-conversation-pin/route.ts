import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    console.log('🔍 Debug: Checking conversation pin status for:', conversationId);

    const db = await getDatabase();
    
    // Check if conversation exists in database
    const conversation = await db.getConversation(conversationId);
    console.log('🔍 Debug: Conversation from database:', conversation);

    // Check all conversations to see pin status
    const allConversations = await db.getAllConversations();
    console.log('🔍 Debug: All conversations:', allConversations.map(c => ({
      id: c.id,
      status: c.status,
      is_pinned: c.is_pinned,
      updated_at: c.updated_at
    })));

    return NextResponse.json({
      success: true,
      conversationId,
      conversation,
      allConversations: allConversations.map(c => ({
        id: c.id,
        status: c.status,
        is_pinned: c.is_pinned,
        updated_at: c.updated_at
      }))
    });

  } catch (error) {
    console.error('Error debugging conversation pin:', error);
    return NextResponse.json(
      { error: 'Failed to debug conversation pin', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
