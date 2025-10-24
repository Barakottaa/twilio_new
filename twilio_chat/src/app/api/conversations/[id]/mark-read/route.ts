import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    
    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    console.log('📖 Marking conversation as read:', conversationId);
    
    const db = await getDatabase();
    await db.markConversationAsRead(conversationId);
    
    console.log('✅ Conversation marked as read successfully:', conversationId);
    
    return NextResponse.json({
      success: true,
      message: 'Conversation marked as read'
    });
    
  } catch (error) {
    console.error('❌ Error marking conversation as read:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark conversation as read'
      },
      { status: 500 }
    );
  }
}
