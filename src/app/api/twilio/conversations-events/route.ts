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
    
    // Extract phone number from author
    const phoneMatch = author?.match(/whatsapp:\+?(\d+)/);
    const phone = phoneMatch ? phoneMatch[1] : null;
    
    console.log('📱 Phone extracted from Author:', phone);
    
    if (phone) {
      // Create/update contact
      try {
        const sqlite3 = require('sqlite3');
        const db = new sqlite3.Database('./database.sqlite');
        const run = require('util').promisify(db.run.bind(db));
        const all = require('util').promisify(db.all.bind(db));
        
        // Check if contact exists
        const existingContacts = await all('SELECT * FROM contacts WHERE phone_number = ?', [phone]);
        
        let contactId;
        if (existingContacts.length > 0) {
          contactId = existingContacts[0].id;
          console.log('✅ Found existing contact:', contactId);
        } else {
          // Create new contact
          contactId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await run(`
            INSERT INTO contacts (id, phone_number, name, avatar, last_seen, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            contactId,
            phone,
            `Contact ${phone}`,
            `https://ui-avatars.com/api/?name=Contact%20${phone}&background=random`,
            new Date().toISOString(),
            new Date().toISOString(),
            new Date().toISOString()
          ]);
          console.log('✅ Created new contact:', contactId);
        }
        
        // Create/update conversation
        const existingConversations = await all('SELECT * FROM conversations WHERE id = ?', [conversationSid]);
        if (existingConversations.length === 0) {
          await run(`
            INSERT INTO conversations (id, contact_id, friendly_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
          `, [
            conversationSid,
            contactId,
            `Conversation with ${phone}`,
            new Date().toISOString(),
            new Date().toISOString()
          ]);
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
        
        await run(`
          INSERT INTO messages (
            id, conversation_id, sender_id, sender_type, content, message_type, 
            twilio_message_sid, media_url, media_content_type, media_filename, 
            media_data, chat_service_sid, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          messageId,
          conversationSid,
          author,
          'contact',
          messageBody,
          mediaData.length > 0 ? 'media' : 'text',
          messageSid,
          firstMedia?.url || null,
          firstMedia?.contentType || null,
          firstMedia?.filename || null,
          mediaJson,
          chatServiceSid,
          new Date().toISOString()
        ]);
        
        console.log('✅ Message stored via conversation events:', {
          messageId,
          conversationSid,
          content: messageBody,
          author,
          mediaCount: mediaData.length
        });
        
        db.close();
        
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
      const sqlite3 = require('sqlite3');
      const db = new sqlite3.Database('./database.sqlite');
      const run = require('util').promisify(db.run.bind(db));
      
      await run(`
        INSERT OR REPLACE INTO conversations (id, friendly_name, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `, [
        conversationSid,
        friendlyName || 'New Conversation',
        dateCreated || new Date().toISOString(),
        new Date().toISOString()
      ]);
      
      db.close();
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
      const sqlite3 = require('sqlite3');
      const db = new sqlite3.Database('./database.sqlite');
      const run = require('util').promisify(db.run.bind(db));
      
      await run(`
        UPDATE conversations 
        SET friendly_name = ?, updated_at = ?
        WHERE id = ?
      `, [
        friendlyName,
        new Date().toISOString(),
        conversationSid
      ]);
      
      db.close();
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
      const sqlite3 = require('sqlite3');
      const db = new sqlite3.Database('./database.sqlite');
      const run = require('util').promisify(db.run.bind(db));
      
      await run(`
        DELETE FROM conversations WHERE id = ?
      `, [conversationSid]);
      
      db.close();
      console.log('✅ Conversation removed from database:', conversationSid);
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