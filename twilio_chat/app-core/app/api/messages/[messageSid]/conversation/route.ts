import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to get conversationSid from a messageSid
 * This allows client-side code to look up conversationSid without importing Node.js modules
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageSid: string }> }
) {
  try {
    const resolvedParams = await params;
    const { messageSid } = resolvedParams;
    
    if (!messageSid) {
      return NextResponse.json({ 
        error: 'messageSid is required' 
      }, { status: 400 });
    }
    
    // Look up the message in the database
    try {
      const { sqliteDb } = await import('@/lib/sqlite-database');
      const db = sqliteDb;
      const message = await db.getMessageByTwilioSid(messageSid);
      
      if (message?.conversation_id) {
        return NextResponse.json({
          success: true,
          conversationSid: message.conversation_id,
          messageSid: messageSid
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Message not found',
          conversationSid: null
        }, { status: 404 });
      }
    } catch (dbError) {
      console.error('❌ Error looking up message in database:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        conversationSid: null
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error in conversation lookup API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      conversationSid: null
    }, { status: 500 });
  }
}

