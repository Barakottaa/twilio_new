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
          const parsedArray = JSON.parse(message.media_data);
          // Filter out invalid media items (must have url and contentType)
          mediaArray = parsedArray.filter((media: any) => 
            media && (media.url || media.sid) && media.contentType
          );
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
      
      // Generate fallback text for media messages without text
      let messageText = message.content || '';
      // Check if this is a media message (by type or by presence of media fields)
      const hasMediaIndicators = message.message_type === 'media' || 
                                 message.media_url || 
                                 message.media_content_type || 
                                 message.media_data ||
                                 mediaArray.length > 0;
      
      if (!messageText && hasMediaIndicators) {
        if (mediaArray.length > 0) {
          const firstMedia = mediaArray[0];
          const mediaType = getMediaType(firstMedia.contentType);
          if (mediaType) {
            const emoji = mediaType === 'image' ? '🖼️' : mediaType === 'video' ? '🎥' : mediaType === 'audio' ? '🎵' : '📄';
            const name = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
            messageText = `📎 ${emoji} ${name}`;
          } else {
            messageText = '📎 Media message';
          }
        } else if (message.media_content_type) {
          const mediaType = getMediaType(message.media_content_type);
          if (mediaType) {
            const emoji = mediaType === 'image' ? '🖼️' : mediaType === 'video' ? '🎥' : mediaType === 'audio' ? '🎵' : '📄';
            const name = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
            messageText = `📎 ${emoji} ${name}`;
          } else {
            messageText = '📎 Media message';
          }
        } else if (message.media_url) {
          messageText = '📎 Media message';
        } else {
          messageText = '📎 Media message';
        }
      }

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
        text: messageText,
        timestamp: timestamp,
        sender: message.sender_type === 'agent' ? 'agent' : 'customer',
        senderId: message.sender_id,
        deliveryStatus: message.delivery_status || (message.sender_type === 'agent' ? 'sent' : undefined),
        twilioMessageSid: message.twilio_message_sid,
        mediaType: getMediaType(message.media_content_type),
        mediaUrl: message.media_url,
        mediaContentType: message.media_content_type,
        mediaFileName: message.media_filename,
        mediaCaption: messageText,
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
