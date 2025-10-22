import { NextRequest, NextResponse } from 'next/server';
import { reassignTwilioConversation } from '@/lib/twilio-service';
import { getDatabase } from '@/lib/database-config';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { agentId } = await req.json();
    
    console.log('🔍 Assignment API called:', { conversationId: resolvedParams.id, agentId });
    
    // Update database first
    const db = await getDatabase();
    await db.updateConversation(resolvedParams.id, { agent_id: agentId });
    console.log('✅ Database assignment updated');
    
    // Then update Twilio (this might fail but database is already updated)
    // Only try to update Twilio if we're assigning (not unassigning)
    if (agentId) {
      try {
        await reassignTwilioConversation(resolvedParams.id, agentId);
        console.log('✅ Twilio assignment updated');
      } catch (twilioError) {
        console.error('⚠️ Twilio assignment failed, but database was updated:', twilioError);
        // Don't fail the entire operation if Twilio fails
      }
    } else {
      console.log('✅ Conversation unassigned (no Twilio update needed)');
    }
    
    return NextResponse.json({
      success: true,
      message: agentId ? 'Conversation assigned successfully' : 'Conversation unassigned successfully',
      conversationId: resolvedParams.id,
      agentId
    });
  } catch (error) {
    console.error('Error assigning conversation:', error);
    return NextResponse.json({ 
      error: 'Failed to update conversation assignment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
