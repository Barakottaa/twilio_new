import { NextRequest, NextResponse } from 'next/server';
import { sqliteDb } from '@/lib/sqlite-database';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const conversationId = resolvedParams.id;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Get messages for the conversation from local database
    await sqliteDb.ensureInitialized();
    const messages = await sqliteDb.getMessagesByConversation(conversationId, limit);
    
    // Transform to match expected format
    const formattedMessages = messages.map(message => ({
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      senderType: message.sender_type,
      content: message.content,
      messageType: message.message_type,
      twilioMessageSid: message.twilio_message_sid,
      mediaUrl: message.media_url,
      mediaContentType: message.media_content_type,
      mediaFilename: message.media_filename,
      mediaData: message.media_data,
      chatServiceSid: message.chat_service_sid,
      createdAt: message.created_at
    }));
    
    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      count: formattedMessages.length
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
