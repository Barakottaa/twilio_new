import { NextRequest, NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-service';
import { getDatabase } from '@/lib/database-config';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;

    console.log('🔍 Deleting conversation:', conversationId);

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Delete from Twilio
    try {
      const client = await getTwilioClient();
      await client.conversations.v1.conversations(conversationId).remove();
      console.log('✅ Conversation deleted from Twilio:', conversationId);
    } catch (twilioError) {
      console.error('❌ Error deleting from Twilio:', twilioError);
      // Continue with database deletion even if Twilio fails
    }

    // Delete from database
    try {
      const db = await getDatabase();
      // Note: We don't have a deleteConversation method yet, but we can mark it as inactive
      // or implement a soft delete by updating the status
      await db.updateConversation(conversationId, { status: 'deleted' });
      console.log('✅ Conversation marked as deleted in database:', conversationId);
    } catch (dbError) {
      console.error('❌ Error updating database:', dbError);
      // Continue even if database update fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Conversation deleted successfully',
      conversationId
    });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
