import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('🔔 CONVERSATION EVENTS WEBHOOK CALLED - Starting processing...');
    console.log('🔔 CONVERSATION EVENTS WEBHOOK CALLED - Time:', new Date().toISOString());
    console.log('🔔 CONVERSATION EVENTS WEBHOOK CALLED - URL:', req.url);
    console.log('🔔 CONVERSATION EVENTS WEBHOOK CALLED - Method:', req.method);

    const body = await req.text();
    console.log('📝 Conversation events webhook body:', body);

    const formData = new URLSearchParams(body);
    const params: { [key: string]: string } = {};
    formData.forEach((value, key) => {
      params[key] = value;
    });

    console.log('📋 Conversation events webhook parameters:', params);

    // Handle different conversation event types
    const eventType = params.EventType;
    console.log('🎯 Event Type:', eventType);

    switch (eventType) {
      case 'onMessageAdded':
        console.log('📨 New message added via conversation events');
        await handleMessageAdded(params);
        break;
      
      case 'onConversationAdded':
        console.log('🆕 New conversation added');
        await handleConversationAdded(params);
        break;
      
      case 'onConversationUpdated':
        console.log('🔄 Conversation updated');
        await handleConversationUpdated(params);
        break;
      
      case 'onConversationRemoved':
        console.log('🗑️ Conversation removed');
        await handleConversationRemoved(params);
        break;
      
      case 'onParticipantAdded':
        console.log('👤 Participant added');
        await handleParticipantAdded(params);
        break;
      
      case 'onParticipantUpdated':
        console.log('🔄 Participant updated');
        await handleParticipantUpdated(params);
        break;
      
      case 'onParticipantRemoved':
        console.log('👋 Participant removed');
        await handleParticipantRemoved(params);
        break;
      
      case 'onDeliveryUpdated':
        console.log('📬 Delivery status updated');
        await handleDeliveryUpdated(params);
        break;
      
      default:
        console.log('❓ Unknown event type:', eventType);
    }

    console.log('✅ Conversation events webhook processing completed successfully');
    return new Response("ok", { status: 200 });

  } catch (error) {
    console.error('❌ Conversation events webhook error:', error);
    return new Response("error", { status: 500 });
  }
}

async function handleMessageAdded(params: { [key: string]: string }) {
  console.log('📨 Processing message added event...');
  console.log('📋 Message params:', JSON.stringify(params, null, 2));
  
  const conversationSid = params.ConversationSid;
  const messageSid = params.MessageSid;
  const body = params.Body;
  const author = params.Author;
  const participantSid = params.ParticipantSid;
  const mediaParam = params.Media; // Media is already provided in the webhook!
  const chatServiceSid = params.ChatServiceSid; // Needed for media URL construction
  
  console.log('🔍 Extracted values:', {
    conversationSid,
    messageSid,
    body: body || '(empty)',
    author,
    participantSid,
    mediaParam: mediaParam || '(none)'
  });
  
  if (conversationSid && messageSid) {
    console.log('🔄 Processing message from conversation events...');
    
    // Extract phone number from author (handle spaces after colon)
    const phoneMatch = author?.match(/whatsapp:\s*(\+?\d+)/);
    const rawPhone = phoneMatch ? phoneMatch[1] : null;
    
    // Normalize phone number to always include + prefix
    const { normalizePhoneNumber } = await import('@/lib/utils');
    const phone = rawPhone ? normalizePhoneNumber(rawPhone) : null;
    
    console.log('📱 Phone extracted from Author:', phone);
    
    if (phone) {
      // Create/update contact
      try {
        const { getDatabase } = await import('@/lib/database-config');
        const db = await getDatabase();
        
        // Check if contact exists
        const existingContacts = await db.findContactByPhone(phone);
        
        let contactId;
        if (existingContacts) {
          contactId = existingContacts.id;
          console.log('✅ Found existing contact:', contactId);
        } else {
          // Create new contact
          contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await db.createContact({
            id: contactId,
            phoneNumber: phone,
            name: `Contact ${phone}`,
            avatar: `https://ui-avatars.com/api/?name=Contact%20${phone}&background=random`,
            lastSeen: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          console.log('✅ Created new contact:', contactId);
        }
        
        // Create/update conversation
        const existingConversations = await db.getConversation(conversationSid);
        if (!existingConversations) {
          await db.createConversation({
            id: conversationSid,
            contactId: contactId,
            title: `Conversation with ${phone}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          console.log('✅ Created new conversation:', conversationSid);
        }
        
        // Parse media data from webhook parameters (already provided!)
        let mediaData: any[] = [];
        let messageBody = body || '';
        
        if (mediaParam) {
          try {
            console.log('📦 Parsing media from webhook parameters...');
            const mediaArray = JSON.parse(mediaParam);
            console.log(`✅ Found ${mediaArray.length} media items in webhook`);
            
            for (const media of mediaArray) {
              console.log('📷 Media item:', {
                sid: media.Sid,
                contentType: media.ContentType,
                filename: media.Filename,
                size: media.Size
              });
              
              // Build the media URL using our proxy endpoint for authentication
              // Include all necessary parameters for Twilio SDK
              const mediaUrl = `/api/media/${media.Sid}?conversationSid=${conversationSid}&chatServiceSid=${chatServiceSid}&messageSid=${messageSid}`;
              
              mediaData.push({
                sid: media.Sid,
                url: mediaUrl,
                contentType: media.ContentType,
                filename: media.Filename || 'file',
                size: media.Size
              });
            }
            
            console.log(`✅ Processed ${mediaData.length} media items successfully`);
          } catch (parseError) {
            console.error('❌ Error parsing media from webhook:', parseError);
          }
        }
        
        // Check if message already exists to prevent duplicates
        const existingMessages = await db.getMessageByTwilioSid(messageSid);
        if (existingMessages) {
          console.log('⚠️ Message already exists, skipping duplicate:', messageSid);
          return;
        }
        
        // Store message with media data
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Serialize media data as JSON for storage
        const mediaJson = mediaData.length > 0 ? JSON.stringify(mediaData) : null;
        const firstMedia = mediaData.length > 0 ? mediaData[0] : null;
        
        console.log('💾 About to store message:', {
          messageId,
          conversationSid,
          body: messageBody || '(empty)',
          messageType: mediaData.length > 0 ? 'media' : 'text',
          mediaCount: mediaData.length,
          firstMediaUrl: firstMedia?.url || 'none',
          mediaJsonLength: mediaJson?.length || 0
        });
        
        await db.createMessage({
          id: messageId,
          conversation_id: conversationSid,
          sender_id: author,
          sender_type: 'contact',
          content: messageBody,
          message_type: mediaData.length > 0 ? 'media' : 'text',
          twilio_message_sid: messageSid,
          media_url: firstMedia?.url || null,
          media_content_type: firstMedia?.contentType || null,
          media_filename: firstMedia?.filename || null,
          media_data: mediaJson,
          chat_service_sid: chatServiceSid,
          created_at: new Date().toISOString()
        });
        
        console.log('✅ Message stored via conversation events:', {
          messageId,
          conversationSid,
          content: messageBody,
          author,
          mediaCount: mediaData.length
        });
        
        // Broadcast the message to connected clients via SSE
        console.log('📡 Broadcasting message to clients...');
        const { broadcastMessage } = require('@/lib/sse-broadcast');
        const { invalidateConversationCache } = require('@/lib/twilio-service');
        
        // Invalidate cache for this conversation
        await invalidateConversationCache(conversationSid);
        
        // Broadcast the new message with media data
        await broadcastMessage('newMessage', {
          conversationSid,
          messageSid,
          body: messageBody,
          author,
          dateCreated: params.DateCreated || new Date().toISOString(),
          index: params.Index || '0',
          numMedia: mediaData.length,
          media: mediaData,
          phone
        });
        console.log('✅ Message broadcasted to UI with', mediaData.length, 'media items');
        
      } catch (error) {
        console.error('❌ Error processing message in conversation events:', error);
      }
    }
  }
}

async function handleConversationAdded(params: { [key: string]: string }) {
  console.log('🆕 Processing conversation added event...');
  console.log('📋 Conversation params:', params);
  
  const conversationSid = params.ConversationSid;
  const friendlyName = params.FriendlyName;
  const dateCreated = params.DateCreated;
  
  if (conversationSid) {
    console.log('🔄 Creating conversation in database...');
    try {
      const { getDatabase } = await import('@/lib/database-config');
      const db = await getDatabase();
      
      await db.createConversation({
        id: conversationSid,
        title: friendlyName || 'New Conversation',
        createdAt: dateCreated || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Conversation added to database:', conversationSid);
    } catch (error) {
      console.error('❌ Error adding conversation to database:', error);
    }
  }
}

async function handleConversationUpdated(params: { [key: string]: string }) {
  console.log('🔄 Processing conversation updated event...');
  console.log('📋 Update params:', params);
  
  const conversationSid = params.ConversationSid;
  const friendlyName = params.FriendlyName;
  
  if (conversationSid) {
    console.log('🔄 Updating conversation in database...');
    try {
      const { getDatabase } = await import('@/lib/database-config');
      const db = await getDatabase();
      
      await db.updateConversation(conversationSid, {
        title: friendlyName,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Conversation updated in database:', conversationSid);
    } catch (error) {
      console.error('❌ Error updating conversation in database:', error);
    }
  }
}

async function handleConversationRemoved(params: { [key: string]: string }) {
  console.log('🗑️ Processing conversation removed event...');
  console.log('📋 Removal params:', params);
  
  const conversationSid = params.ConversationSid;
  
  if (conversationSid) {
    console.log('🔄 Removing conversation from database...');
    try {
      // Note: deleteConversation method not implemented yet
      console.log('⚠️ Conversation removal not implemented yet:', conversationSid);
    } catch (error) {
      console.error('❌ Error removing conversation from database:', error);
    }
  }
}

async function handleParticipantAdded(params: { [key: string]: string }) {
  console.log('👤 Processing participant added event...');
  console.log('📋 Participant params:', params);
  
  const conversationSid = params.ConversationSid;
  const participantSid = params.ParticipantSid;
  const identity = params.Identity;
  const attributes = params.Attributes;
  
  console.log('✅ Participant added:', { conversationSid, participantSid, identity });
}

async function handleParticipantUpdated(params: { [key: string]: string }) {
  console.log('🔄 Processing participant updated event...');
  console.log('📋 Update params:', params);
  
  const conversationSid = params.ConversationSid;
  const participantSid = params.ParticipantSid;
  const identity = params.Identity;
  
  console.log('✅ Participant updated:', { conversationSid, participantSid, identity });
}

async function handleParticipantRemoved(params: { [key: string]: string }) {
  console.log('👋 Processing participant removed event...');
  console.log('📋 Removal params:', params);
  
  const conversationSid = params.ConversationSid;
  const participantSid = params.ParticipantSid;
  const identity = params.Identity;
  
  console.log('✅ Participant removed:', { conversationSid, participantSid, identity });
}

async function handleDeliveryUpdated(params: { [key: string]: string }) {
  console.log('📬 Processing delivery status update...');
  console.log('📋 Delivery params:', params);
  
  const messageSid = params.MessageSid;
  const status = params.Status;
  const conversationSid = params.ConversationSid;
  const deliveryReceiptSid = params.DeliveryReceiptSid;
  const channelMessageSid = params.ChannelMessageSid;
  const participantSid = params.ParticipantSid;
  const errorCode = params.ErrorCode;
  const dateCreated = params.DateCreated;
  const dateUpdated = params.DateUpdated;
  
  if (!messageSid || !status || !conversationSid) {
    console.log('⚠️ Missing required parameters for delivery update');
    return;
  }
  
  console.log('📬 Updating delivery status:', { 
    messageSid, 
    status, 
    conversationSid,
    deliveryReceiptSid,
    channelMessageSid,
    participantSid,
    errorCode,
    dateCreated,
    dateUpdated
  });
  
  try {
    // Import SSE broadcast function
    const { broadcastMessage } = await import('@/lib/sse-broadcast');
    
    // Map Twilio delivery status to our status (including undelivered)
    let deliveryStatus: 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';
    switch (status.toLowerCase()) {
      case 'sent':
        deliveryStatus = 'sent';
        break;
      case 'delivered':
        deliveryStatus = 'delivered';
        break;
      case 'read':
        deliveryStatus = 'read';
        break;
      case 'failed':
        deliveryStatus = 'failed';
        break;
      case 'undelivered':
        deliveryStatus = 'undelivered';
        break;
      default:
        console.log('⚠️ Unknown delivery status:', status);
        return;
    }
    
    // Store detailed receipt information in database
    try {
      const { getDatabase } = await import('@/lib/database-config');
      const db = await getDatabase();
      
      // Check if we have a message with this Twilio SID
      const existingMessage = await db.getMessageByTwilioSid(messageSid);
      if (existingMessage) {
        // Update message with latest delivery status
        await db.updateMessageDeliveryStatus(messageSid, deliveryStatus);
        console.log('📬 Updated message delivery status in database:', { messageSid, deliveryStatus });
      } else {
        console.log('⚠️ Message not found in database for delivery status update:', messageSid);
      }
    } catch (dbError) {
      console.error('❌ Error updating message delivery status in database:', dbError);
    }
    
    // Broadcast enhanced delivery status update to connected clients
    await broadcastMessage('deliveryStatusUpdate', {
      conversationSid,
      messageSid,
      status: deliveryStatus,
      deliveryReceiptSid,
      channelMessageSid,
      participantSid,
      errorCode: errorCode ? parseInt(errorCode) : null,
      dateCreated,
      dateUpdated: dateUpdated || new Date().toISOString(),
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Enhanced delivery status update broadcasted:', { 
      messageSid, 
      status: deliveryStatus,
      errorCode,
      participantSid
    });
    
  } catch (error) {
    console.error('❌ Error processing delivery update:', error);
  }
}