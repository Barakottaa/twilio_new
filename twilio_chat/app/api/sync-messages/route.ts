import { NextRequest, NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-service';
import { getDatabase } from '@/lib/database-config';

export async function POST(req: NextRequest) {
  try {
    const { conversationId, forceSync = false } = await req.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Starting message sync for conversation:', conversationId);

    const twilioClient = await getTwilioClient();
    const db = await getDatabase();

    // Get all messages from Twilio
    const twilioMessages = await twilioClient.conversations.v1
      .conversations(conversationId)
      .messages
      .list({ limit: 1000 }); // Get up to 1000 messages

    console.log(`📨 Found ${twilioMessages.length} messages in Twilio`);

    let syncedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const twilioMsg of twilioMessages) {
      try {
        // Check if message already exists in database
        const existingMessage = await db.getMessageByTwilioSid(twilioMsg.sid);
        
        if (existingMessage && !forceSync) {
          skippedCount++;
          continue;
        }

        // Extract phone number from author for contact creation
        const phoneMatch = twilioMsg.author?.match(/whatsapp:(\+?\d+)/);
        const rawPhone = phoneMatch ? phoneMatch[1] : null;
        
        // Normalize phone number to always include + prefix
        const { normalizePhoneNumber } = await import('@/lib/utils');
        const phone = rawPhone ? normalizePhoneNumber(rawPhone) : null;

        let contactId = null;
        if (phone) {
          // Find or create contact
          const existingContact = await db.findContactByPhone(phone);
          if (existingContact) {
            contactId = existingContact.id;
          } else {
            contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await db.createContact({
              id: contactId,
              phone_number: phone,
              name: `Contact ${phone}`,
              avatar: `https://ui-avatars.com/api/?name=Contact%20${phone}&background=random`,
              last_seen: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }

        // Ensure conversation exists
        const existingConversation = await db.getConversation(conversationId);
        if (!existingConversation) {
          await db.createConversation({
            id: conversationId,
            contact_id: contactId,
            twilio_conversation_sid: conversationId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }

        // Process media if present
        let mediaData = [];
        if (twilioMsg.media) {
          for (const media of twilioMsg.media) {
            // Only include media items with required fields
            if (media && media.sid && media.contentType) {
              mediaData.push({
                sid: media.sid,
                url: `/api/media/${media.sid}?conversationSid=${conversationId}&chatServiceSid=${twilioMsg.chatServiceSid}&messageSid=${twilioMsg.sid}`,
                contentType: media.contentType,
                filename: media.filename || 'file',
                size: media.size
              });
            }
          }
        }

        // Determine sender type
        const isAgentMessage = twilioMsg.author && (
          twilioMsg.author.startsWith('agent-') || 
          twilioMsg.author === 'admin_001'
        );

        // Generate fallback text for media messages without text
        let messageContent = twilioMsg.body || '';
        if (!messageContent && mediaData.length > 0) {
          const firstMedia = mediaData[0];
          const getMediaType = (contentType: string) => {
            if (contentType?.startsWith('image/')) return 'image';
            if (contentType?.startsWith('video/')) return 'video';
            if (contentType?.startsWith('audio/')) return 'audio';
            return 'document';
          };
          const mediaType = getMediaType(firstMedia.contentType);
          const emoji = mediaType === 'image' ? '🖼️' : mediaType === 'video' ? '🎥' : mediaType === 'audio' ? '🎵' : '📄';
          const name = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
          messageContent = `📎 ${emoji} ${name}`;
        }

        // Create message in database
        try {
          const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await db.createMessage({
            id: messageId,
            conversation_id: conversationId,
            sender_id: twilioMsg.author || 'unknown',
            sender_type: isAgentMessage ? 'agent' : 'contact',
            content: messageContent,
            message_type: mediaData.length > 0 ? 'media' : 'text',
            twilio_message_sid: twilioMsg.sid,
            media_url: mediaData.length > 0 ? mediaData[0].url : null,
            media_content_type: mediaData.length > 0 ? mediaData[0].contentType : null,
            media_filename: mediaData.length > 0 ? mediaData[0].filename : null,
            media_data: mediaData.length > 0 ? JSON.stringify(mediaData) : null,
            chat_service_sid: twilioMsg.chatServiceSid,
            created_at: twilioMsg.dateCreated ? new Date(twilioMsg.dateCreated).toISOString() : new Date().toISOString()
          });
          syncedCount++;
          console.log(`✅ Synced message: ${twilioMsg.sid}`);
        } catch (error: any) {
          // Handle UNIQUE constraint errors gracefully
          if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE constraint')) {
            console.log(`⚠️ Message ${twilioMsg.sid} already exists, skipping`);
            skippedCount++;
          } else {
            console.error(`❌ Failed to sync message ${twilioMsg.sid}:`, error);
            failedCount++;
          }
        }

      } catch (msgError: any) {
        // Handle UNIQUE constraint errors at the outer level too
        if (msgError.code === 'SQLITE_CONSTRAINT_UNIQUE' || msgError.message?.includes('UNIQUE constraint')) {
          console.log(`⚠️ Message ${twilioMsg.sid} already exists (outer catch), skipping`);
          skippedCount++;
        } else {
          console.error(`❌ Failed to sync message ${twilioMsg.sid}:`, msgError);
          failedCount++;
        }
      }
    }

    console.log(`🎉 Sync completed: ${syncedCount} synced, ${skippedCount} skipped, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      message: 'Messages synced successfully',
      syncedCount,
      skippedCount,
      totalMessages: twilioMessages.length
    });

  } catch (error) {
    console.error('❌ Error syncing messages:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync messages',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
