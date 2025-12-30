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
    
    // Transform to match expected format for Android app
    const formattedMessages = messages.map(message => {
      // Parse media data if present
      let mediaArray: any[] = [];
      if (message.media_data) {
        try {
          mediaArray = JSON.parse(message.media_data);
        } catch (e) {
          console.error('Error parsing media_data:', e);
        }
      }

      // Determine media type from content type
      const getMediaType = (contentType: string | null) => {
        if (!contentType) return undefined;
        if (contentType.startsWith('image/')) return 'image';
        if (contentType.startsWith('video/')) return 'video';
        if (contentType.startsWith('audio/')) return 'audio';
        if (contentType.startsWith('application/') || contentType.startsWith('text/')) return 'document';
        return undefined;
      };

      // Ensure timestamp is in ISO format
      let timestamp = message.created_at;
      if (timestamp) {
        try {
          // If it's already a valid ISO string, use it; otherwise try to convert
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            timestamp = date.toISOString();
          } else {
            // Fallback to current time if invalid
            timestamp = new Date().toISOString();
          }
        } catch (e) {
          timestamp = new Date().toISOString();
        }
      } else {
        timestamp = new Date().toISOString();
      }

      return {
        id: message.id,
        text: message.content || '',
        timestamp: timestamp,
        sender: message.sender_type === 'agent' ? 'agent' : 'customer',
        senderId: message.sender_id,
        deliveryStatus: message.delivery_status || (message.sender_type === 'agent' ? 'sent' : undefined),
        twilioMessageSid: message.twilio_message_sid,
        mediaType: getMediaType(message.media_content_type),
        mediaUrl: message.media_url,
        mediaContentType: message.media_content_type,
        mediaFileName: message.media_filename,
        mediaCaption: message.content || '',
        media: mediaArray.length > 0 ? mediaArray : undefined,
      };
    });
    
    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      count: formattedMessages.length
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      conversationId,
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch messages',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
