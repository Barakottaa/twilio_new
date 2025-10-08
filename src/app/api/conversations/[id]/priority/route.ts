import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { priority } = await request.json();

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      );
    }

    // TODO: Update priority in database
    // For now, we'll just return success
    // In a real implementation, you would:
    // 1. Update the conversation priority in your database
    // 2. Log the priority change
    // 3. Possibly trigger notifications or reordering

    console.log(`🔍 Updating conversation ${conversationId} priority to ${priority}`);

    return NextResponse.json({
      success: true,
      conversationId,
      priority,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating conversation priority:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation priority' },
      { status: 500 }
    );
  }
}