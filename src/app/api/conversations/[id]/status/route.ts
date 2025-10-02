import { NextRequest, NextResponse } from 'next/server';
import type { ConversationStatus } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    const { status } = await request.json();

    // Validate status
    const validStatuses: ConversationStatus[] = ['open', 'closed', 'pending', 'resolved', 'escalated'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // TODO: Update status in database
    // For now, we'll just return success
    // In a real implementation, you would:
    // 1. Update the conversation status in your database
    // 2. Log the status change
    // 3. Possibly trigger notifications

    console.log(`🔍 Updating conversation ${conversationId} status to ${status}`);

    return NextResponse.json({
      success: true,
      conversationId,
      status,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating conversation status:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation status' },
      { status: 500 }
    );
  }
}