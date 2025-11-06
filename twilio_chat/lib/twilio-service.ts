'use server';

import type { Agent, Chat, Customer, Message } from '@/types';
import twilio from 'twilio';
import { PlaceHolderImages } from './placeholder-images';
import { getContact, getDisplayName, formatPhoneNumber, updateLastSeen, getAllContacts, addContact } from './contact-mapping';
import { getDatabase } from './database-config';

// Helper functions for media type detection
function getMediaTypeFromContentType(contentType: string): 'image' | 'video' | 'audio' | 'document' {
  if (!contentType) return 'document';
  
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  return 'document';
}

function getMediaTypeEmoji(mediaType: string): string {
  switch (mediaType) {
    case 'image': return '🖼️';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'document': return '📄';
    default: return '📎';
  }
}

function getMediaTypeName(mediaType: string): string {
  switch (mediaType) {
    case 'image': return 'Image';
    case 'video': return 'Video';
    case 'audio': return 'Audio';
    case 'document': return 'Document';
    default: return 'File';
  }
}

// Helper functions to load conversation data from database
async function getConversationStatusFromDatabase(conversationId: string): Promise<'open' | 'closed'> {
  try {
    const db = await getDatabase();
    const conversation = await db.getConversation(conversationId);
    const status = (conversation?.status as 'open' | 'closed') || 'open';
    // Loaded conversation status from database
    return status;
  } catch (error) {
    console.error('Error loading conversation status from database:', error);
    return 'open'; // Default to open if error
  }
}

async function getConversationPinStatusFromDatabase(conversationId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const conversation = await db.getConversation(conversationId);
    const isPinned = conversation?.is_pinned === 1;
    // Loaded conversation pin status from database
    return isPinned;
  } catch (error) {
    console.error('Error loading conversation pin status from database:', error);
    return false; // Default to not pinned if error
  }
}

async function getConversationNewStatusFromDatabase(conversationId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const conversation = await db.getConversation(conversationId);
    
    // Only mark as new if:
    // 1. It's marked as new in database (is_new = 1)
    // 2. It's an open conversation (not closed)
    // 3. It has no agent replies yet
    const isNewInDb = conversation?.is_new === 1;
    const isOpen = conversation?.status === 'open';
    const hasAgentReplies = await db.hasAgentReplies(conversationId);
    
    const shouldBeNew = isNewInDb && isOpen && !hasAgentReplies;
    
    console.log('🆕 Conversation new status check:', {
      conversationId,
      isNewInDb,
      isOpen,
      hasAgentReplies,
      shouldBeNew
    });
    
    return shouldBeNew;
  } catch (error) {
    console.error('Error loading conversation new status from database:', error);
    return false; // Default to not new if error
  }
}

// A map to cache agent and customer details to avoid repeated lookups
const userCache = new Map<string, Agent | Customer>();

// Enhanced cache for conversations to reduce API calls
const conversationCache = new Map<string, { data: Chat[], timestamp: number }>();
const participantCache = new Map<string, { data: any[], timestamp: number }>();
const messageCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache
const PARTICIPANT_CACHE_DURATION = 60000; // 1 minute for participants
const MESSAGE_CACHE_DURATION = 15000; // 15 seconds for messages

// Function to invalidate cache when new messages arrive
export async function invalidateConversationCache(conversationSid?: string) {
  if (conversationSid) {
    // Invalidate specific conversation cache
    for (const [key, value] of conversationCache.entries()) {
      if (key.includes(conversationSid)) {
        conversationCache.delete(key);
      }
    }
  } else {
    // Invalidate all cache
    conversationCache.clear();
  }
  // Conversation cache invalidated
}

export async function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are not configured in environment variables. Please check your .env file.');
  }
  if (!accountSid.startsWith('AC')) {
    throw new Error('Invalid TWILIO_ACCOUNT_SID. It must start with "AC". Please check your .env file.');
  }

  return twilio(accountSid, authToken);
}

// ---- Helpers for light listing & paged messages ----
export async function listConversationsLite(limit = 30, after?: string) {
  try {
    const client = await getTwilioClient();
    // Twilio allows up to 1000 conversations per page, but we'll cap at 200 for performance
    const opts: any = { limit: Math.min(limit, 200) };
    if (after) opts.pageToken = after;
    const page = await client.conversations.v1.conversations.page(opts);
    
    // Fetch participant info for each conversation to get proper names
    const items = await Promise.all(page.instances.map(async (c: any) => {
      try {
        // Get participants to find customer name
        const participants = await client.conversations.v1
          .conversations(c.sid)
          .participants.list();
        
        // Find customer and agent participants
        const customerParticipant = participants.find(p => {
          if (!p.identity) {
            // If identity is null, check if it's a WhatsApp participant (customer)
            return p.messagingBinding && p.messagingBinding.type === 'whatsapp';
          }
          return !p.identity.startsWith('agent-') && !p.identity.startsWith('admin-') && 
                 !p.identity.startsWith('agent_') && !p.identity.startsWith('admin_');
        });
      
      const agentParticipant = participants.find(p => 
        p.identity && (p.identity.startsWith('agent-') || p.identity.startsWith('admin-') ||
                      p.identity.startsWith('agent_') || p.identity.startsWith('admin_'))
      );
      
      // Also check for system/Twilio participant (might have proxyAddress)
      // Twilio returns proxy_address (snake_case), not proxyAddress (camelCase)
      const systemParticipant = participants.find(p => 
        p.messagingBinding && 
        p.messagingBinding.proxy_address && 
        p.messagingBinding.proxy_address.startsWith('whatsapp:')
      );
      
      let customerName = 'Unknown Customer';
      let customerPhone = '';
      let customerEmail = '';
      
      if (customerParticipant) {
        // Get phone number from messaging binding
        customerPhone = customerParticipant.messagingBinding?.address?.replace('whatsapp:', '') || '';
        
        // Try to get contact from our database first
        if (customerPhone) {
          try {
            const { findContactByPhone } = await import('@/lib/contacts-service');
            const dbContact = await findContactByPhone(customerPhone);
            if (dbContact) {
              customerName = dbContact.name;
              customerEmail = dbContact.email || '';
            }
          } catch (error) {
            console.log('🔍 Error looking up contact in database:', error);
          }
        }
        
        // Fallback to Twilio participant data if no database contact found
        if (customerName === 'Unknown Customer') {
          try {
            const attributes = customerParticipant.attributes ? 
              JSON.parse(customerParticipant.attributes) : {};
            customerName = attributes.display_name || 
                          customerParticipant.identity || 
                          'Unknown Customer';
            customerEmail = attributes.email || '';
          } catch {
            customerName = customerParticipant.identity || 'Unknown Customer';
          }
        }
        
        // If still no name, use formatted phone number (without + prefix)
        if (customerName === 'Unknown Customer' && customerPhone) {
          customerName = customerPhone.replace(/^\+/, '');
        }
      }
      
      let agentName = 'Unassigned';
      let agentId = null; // Always start as unassigned
      let agentStatus = 'offline';
      
      // ONLY check database for assignments - ignore Twilio participants
      try {
        // Only import database on server side
        if (typeof window === 'undefined') {
          const { getDatabase } = await import('@/lib/database-config');
          const db = await getDatabase();
          const dbConversation = await db.getConversation(c.sid);
          
          if (dbConversation && dbConversation.agent_id) {
            // Get agent details from database
            const agent = await db.getAgent(dbConversation.agent_id);
            if (agent) {
              agentId = agent.id;
              agentName = agent.username;
              agentStatus = 'online';
              console.log('🔍 Database assignment found:', { conversationId: c.sid, agentId, agentName });
            }
          } else {
            console.log('🔍 No database assignment for conversation:', c.sid);
          }
        }
      } catch (error) {
        console.log('🔍 Error checking database assignment:', error);
      }
      
      // Load status, pin status, and new status from database EARLY so we can use `status` when determining unreplied state
      const [status, isPinned, isNew] = await Promise.all([
        getConversationStatusFromDatabase(c.sid),
        getConversationPinStatusFromDatabase(c.sid),
        getConversationNewStatusFromDatabase(c.sid)
      ]);

      // Get the last message for preview and timestamp
      let lastMessagePreview = '';
      let lastMessageTimestamp = c.dateUpdated?.toISOString?.() ?? c.dateCreated?.toISOString?.() ?? new Date().toISOString();
      let isLastMessageFromCustomer = false;

      // First try to get last message from database using better-sqlite3 directly (fast & avoids missing adapter methods)
      try {
        const Database = require('better-sqlite3');
        const dbConn = new Database('./database.sqlite');
        const stmt = dbConn.prepare(`SELECT sender_type, content, media_content_type, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1`);
        const row = stmt.get(c.sid);
        dbConn.close();

        if (row) {
          if (row.content) {
            lastMessagePreview = row.content.length > 50 ? `${row.content.slice(0, 50)}...` : row.content;
          } else if (row.media_content_type) {
            lastMessagePreview = '[Media]';
          } else {
            lastMessagePreview = '[Message]';
          }
          lastMessageTimestamp = row.created_at;
          isLastMessageFromCustomer = row.sender_type === 'customer';
          console.log(`✅ Got last message from database for ${c.sid}: ${lastMessagePreview}`);
        } else {
          console.log(`📭 No messages in database for ${c.sid}`);
        }
      } catch (dbErr) {
        console.log('⚠️ DB error while fetching last msg, will try Twilio:', dbErr);
      }

      // If still no preview, fallback to Twilio API (network may be slower, so we try database first)
      if (!lastMessagePreview) {
        try {
          const twilioMsgs = await c.messages().list({ limit: 1, order: 'desc' });
          if (twilioMsgs.length) {
            const lastMsg = twilioMsgs[0];
            if (lastMsg.body) {
              lastMessagePreview = lastMsg.body.length > 50 ? `${lastMsg.body.slice(0, 50)}...` : lastMsg.body;
            } else if (lastMsg.media) {
              lastMessagePreview = '[Media]';
            } else {
              lastMessagePreview = '[Message]';
            }
            lastMessageTimestamp = lastMsg.dateCreated?.toISOString?.() ?? lastMessageTimestamp;
            isLastMessageFromCustomer = lastMsg.author && (lastMsg.author.startsWith('whatsapp:') || !lastMsg.author.includes('agent'));
            console.log(`✅ Got last message from Twilio for ${c.sid}: ${lastMessagePreview}`);
          }
        } catch (twErr) {
          console.log('Could not fetch last message for conversation:', c.sid, twErr);
          lastMessagePreview = 'No messages yet';
        }
      }

      // Determine unreplied after we have both isLastMessageFromCustomer and status
      const isUnreplied = isLastMessageFromCustomer && status === 'open';

      // Extract proxyAddress to identify which number this conversation uses
      let proxyAddress: string | undefined;
      let twilioNumberId: string | undefined;
      
      // Twilio returns proxy_address (snake_case), not proxyAddress (camelCase)
      // Use bracket notation to access property in case TypeScript types don't match runtime
      const customerProxyAddress = customerParticipant?.messagingBinding?.['proxy_address'] as string | undefined;
      if (customerProxyAddress) {
        proxyAddress = customerProxyAddress;
      } 
      // Then check system participant (if it exists)
      else {
        const systemProxyAddress = systemParticipant?.messagingBinding?.['proxy_address'] as string | undefined;
        if (systemProxyAddress) {
          proxyAddress = systemProxyAddress;
        }
        // Check all participants for proxyAddress
        else {
          for (const p of participants) {
            const pProxyAddress = p.messagingBinding?.['proxy_address'] as string | undefined;
            if (pProxyAddress) {
              proxyAddress = pProxyAddress;
              break;
            }
          }
        }
      }
      
      // If we found proxyAddress, try to match it to configured numbers
      if (proxyAddress) {
        try {
          const { getNumberByPhone } = await import('./multi-number-config');
          const matchedNumber = getNumberByPhone(proxyAddress);
          if (matchedNumber) {
            twilioNumberId = matchedNumber.id;
          }
        } catch (e) {
          console.error('Error matching proxyAddress to configured number:', e);
        }
      }

      // Build conversation item
      const conversationItem = {
        id: c.sid,
        title: customerName,
        lastMessagePreview,
        unreadCount: 0,
        createdAt: c.dateCreated?.toISOString?.() ?? new Date().toISOString(),
        updatedAt: lastMessageTimestamp,
        customerId: customerParticipant?.identity || 'unknown',
        agentId: agentId,
        // Additional information for enhanced display
        customerPhone: customerPhone,
        customerEmail: customerEmail,
        agentName: agentName,
        agentStatus: agentStatus,
        status,
        isPinned,
        isNew,
        isUnreplied,
        // Twilio number information
        proxyAddress,
        twilioNumberId,
      };
      return conversationItem;
    } catch (error) {
      console.error('Error fetching participants for conversation:', c.sid, error);
      
      // Load status and pin status from database for fallback
      const [status, isPinned] = await Promise.all([
        getConversationStatusFromDatabase(c.sid),
        getConversationPinStatusFromDatabase(c.sid)
      ]);
      
      // Fallback to basic info
      return {
        id: c.sid,
        title: c.friendlyName || c.sid,
        lastMessagePreview: 'No messages yet',
        unreadCount: 0,
        createdAt: c.dateCreated?.toISOString?.() ?? new Date().toISOString(),
        updatedAt: c.dateUpdated?.toISOString?.() ?? c.dateCreated?.toISOString?.() ?? new Date().toISOString(),
        customerId: 'unknown',
        agentId: 'unknown',
        status: status,
        isPinned: isPinned,
        proxyAddress: undefined,
        twilioNumberId: undefined,
      };
    }
  }));
  
  const nextCursor = page.nextPageUrl ? page.nextPageUrl.match(/PageToken=([^&]+)/)?.[1] : undefined;
  return { items, nextCursor };
  } catch (error) {
    console.error('❌ Error in listConversationsLite:', error);
    throw error;
  }
}

export async function listMessages(conversationId: string, limit = 25, before?: string) {
  // First, try to get messages from our database
  try {
    const Database = require('better-sqlite3');
    const db = new Database('./database.sqlite');
    
    // Get the LATEST messages first (DESC), then reverse to show oldest-first in UI
    const stmt = db.prepare(`
      SELECT 
        id, conversation_id, sender_id, sender_type, content, message_type,
        twilio_message_sid, delivery_status, media_url, media_content_type, media_filename,
        media_data, chat_service_sid, created_at
      FROM messages 
      WHERE conversation_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    const dbMessages = stmt.all(conversationId, limit);
    
    db.close();
    
    if (dbMessages && dbMessages.length > 0) {
      console.log('✅ Found', dbMessages.length, 'messages in database');
      const messages = dbMessages.map((msg: any) => {
        // Parse media data from JSON if it exists
        let mediaArray = [];
        if (msg.media_data) {
          try {
            mediaArray = JSON.parse(msg.media_data);
            
            // Reconstruct media URLs ONLY if chatServiceSid is available
            // Old messages without chat_service_sid will keep their original URLs (which will fail)
            // But at least the messages will still show
            if (msg.chat_service_sid && msg.twilio_message_sid) {
              mediaArray = mediaArray.map((media: any) => ({
                ...media,
                url: `/api/media/${media.sid}?conversationSid=${conversationId}&chatServiceSid=${msg.chat_service_sid}&messageSid=${msg.twilio_message_sid}`
              }));
            }
            // If no chat_service_sid, keep the media array as-is (URLs will be broken but message will show)
          } catch (error) {
            console.error('Error parsing media data:', error);
            // Don't let media parsing errors break the entire message
            mediaArray = [];
          }
        }
        
        // Determine text content - use body if available, otherwise use media description
        let messageText = msg.content || '';
        if (!messageText && msg.message_type === 'media' && mediaArray.length > 0) {
          // If no text but has media, use a descriptive message
          const firstMedia = mediaArray[0];
          const mediaType = getMediaTypeFromContentType(firstMedia.contentType);
          messageText = `📎 ${getMediaTypeEmoji(mediaType)} ${getMediaTypeName(mediaType)}`;
        }
        
        return {
          id: msg.id,
          text: messageText,
          timestamp: msg.created_at,
          sender: msg.sender_type,
          senderId: msg.sender_id,
          // Delivery status for agent messages
          deliveryStatus: msg.sender_type === 'agent' ? (msg.delivery_status || 'sent') : undefined,
          twilioMessageSid: msg.twilio_message_sid,
          // Legacy media fields for backward compatibility
          mediaType: msg.media_content_type ? getMediaTypeFromContentType(msg.media_content_type) : undefined,
          mediaUrl: msg.media_url || undefined,
          mediaContentType: msg.media_content_type || undefined,
          mediaFileName: msg.media_filename || undefined,
          mediaCaption: messageText,
          // New media array format
          media: mediaArray.length > 0 ? mediaArray : undefined
        };
      });
      
      // Reverse the array to show oldest-first (since we queried DESC to get latest)
      const orderedMessages = messages.reverse();
      console.log(`✅ Returning ${orderedMessages.length} messages from database (latest ${limit})`);
      return { messages: orderedMessages, nextBefore: undefined };
    } else {
      console.log('⚠️ No messages found in database, falling back to Twilio API');
    }
  } catch (error) {
    console.log('⚠️ Error fetching from database, falling back to Twilio:', error);
  }
  
  // Fallback to Twilio API if no database messages or error
  console.log('🔄 Fetching messages from Twilio API...');
  const client = await getTwilioClient();
  const convo = client.conversations.v1.conversations(conversationId);
  const opts: any = { limit: Math.min(limit, 100) };
  if (before) opts.pageToken = before; // simplistic cursor using Twilio pages
  const page = await convo.messages.page(opts);
  // Twilio messages page loaded
  const messages = await Promise.all(page.instances.map(async (msg: any) => {
    // Map media defensively (Conversations API exposes media collection)
    let mediaArr: any[] = [];
    try {
      if (msg.attachedMedia && msg.attachedMedia.length) {
        mediaArr = msg.attachedMedia.map((m: any) => ({
          url: m.links?.contentDirect || m.mediaUrl || m.url,
          contentType: m.contentType || m.type,
          filename: m.filename
        }));
      }
    } catch {}
    // determine sender
    const senderId = msg.author ?? 'unknown';
    const sender = (senderId.startsWith('agent:') || senderId === 'admin_001') ? 'agent' : 'customer';
    // Determine text content - use body if available, otherwise use media description
    let messageText = msg.body ?? '';
    if (!messageText && mediaArr.length > 0) {
      // If no text but has media, use a descriptive message
      const firstMedia = mediaArr[0];
      const mediaType = getMediaTypeFromContentType(firstMedia.contentType);
      messageText = `📎 ${getMediaTypeEmoji(mediaType)} ${getMediaTypeName(mediaType)}`;
    }
    
    const mappedMessage = {
      id: msg.sid,
      text: messageText,
      timestamp: msg.dateCreated ? new Date(msg.dateCreated).toISOString() : new Date().toISOString(),
      sender,
      senderId,
      // Delivery status for agent messages
      deliveryStatus: sender === 'agent' ? 'sent' : undefined,
      twilioMessageSid: msg.sid,
      // Legacy media fields for backward compatibility
      mediaType: mediaArr.length > 0 ? getMediaTypeFromContentType(mediaArr[0].contentType) : undefined,
      mediaUrl: mediaArr.length > 0 ? mediaArr[0].url : undefined,
      mediaContentType: mediaArr.length > 0 ? mediaArr[0].contentType : undefined,
      mediaFileName: mediaArr.length > 0 ? mediaArr[0].filename : undefined,
      mediaCaption: mediaArr.length > 0 ? messageText : undefined,
      // New media array format
      media: mediaArr.length ? mediaArr : undefined
    };
    // Mapped message
    return mappedMessage;
  }));
  const nextBefore = page.nextPageUrl ? page.nextPageUrl.match(/PageToken=([^&]+)/)?.[1] : undefined;
  return { messages, nextBefore };
}

async function getUserDetails(identity: string, isAgent: boolean, participant?: any): Promise<Agent | Customer> {
  // Clear cache for customers to ensure we get fresh participant data
  if (!isAgent && userCache.has(identity)) {
    console.log('🔄 Clearing cache for customer:', identity);
    userCache.delete(identity);
  }
  
  if (userCache.has(identity)) {
    console.log('📋 Using cached user for:', identity);
    return userCache.get(identity)!;
  }

      console.log('🔄 Creating user details for:', { identity, isAgent, participant });
  
  // Log the full participant data to see what's available
  if (participant) {
    console.log('Full participant data:', JSON.stringify(participant, null, 2));
  }

  // In a real app, you'd fetch user details from your database
  // For now, we'll create placeholder users and cache them.
  const user: Agent | Customer = {
    id: identity,
    name: identity,
    avatar: isAgent 
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(identity)}&background=3b82f6&color=ffffff&size=150`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(identity)}&background=10b981&color=ffffff&size=150`,
  };

      // For agents, use the identity as name and add enhanced properties
      if (isAgent) {
        user.name = identity || 'Unknown Agent';
        // Add enhanced agent properties
        (user as Agent).email = `${identity?.replace('agent-', '')}@company.com`;
        (user as Agent).status = 'online';
        (user as Agent).maxConcurrentChats = 5;
        (user as Agent).currentChats = 0;
        (user as Agent).skills = ['customer-support'];
        (user as Agent).department = 'Customer Success';
        (user as Agent).lastActive = new Date().toISOString();
      } else {
    // For customers, we'll extract the real name from participant data below
    user.name = 'Unknown Customer';
  }

      // If it's a customer and we have participant data, try to extract contact info
      if (!isAgent && participant) {
        const customer = user as Customer;
        
        // PRIORITY 1: Check participant.attributes.display_name (set by our webhook)
        console.log('🔍 Checking participant attributes:', participant.attributes);
        if (participant.attributes) {
          try {
            const attrs = JSON.parse(participant.attributes);
            console.log('📋 Parsed attributes:', attrs);
            if (attrs.display_name) {
              customer.name = attrs.display_name;
              console.log('✅ Using participant display_name:', attrs.display_name);
            } else {
              console.log('⚠️ No display_name found in attributes');
            }
            // Also extract other attributes
            customer.phoneNumber = attrs.phoneNumber || attrs.phone || attrs.contact;
            customer.email = attrs.email;
          } catch (e) {
            console.log('⚠️ Failed to parse participant attributes:', e);
          }
        } else {
          console.log('⚠️ No participant attributes found');
        }
        
        // PRIORITY 2: Extract phone number from WhatsApp messaging binding
        if (participant.messagingBinding?.address) {
          const address = participant.messagingBinding.address;
          // Extract phone number from "whatsapp:+1234567890" format
          const phoneMatch = address.match(/whatsapp:(\+?\d+)/);
          if (phoneMatch) {
            const phoneNumber = phoneMatch[1];
            customer.phoneNumber = phoneNumber;
            
            // Only use contact mapping if we don't already have a display_name
            if (!customer.name || customer.name === 'Unknown Customer') {
              console.log('🔍 Looking up contact for phone:', phoneNumber);
              let contactInfo = getContact(phoneNumber);
              
              if (contactInfo) {
                customer.name = contactInfo.name;
                customer.avatar = contactInfo.avatar || customer.avatar;
                customer.lastSeen = contactInfo.lastSeen;
                console.log('✅ Using contact mapping name:', contactInfo.name);
              } else {
                // Final fallback to formatted phone number
                const formattedPhone = formatPhoneNumber(phoneNumber);
                customer.name = formattedPhone;
                console.log('📱 Using formatted phone as name:', formattedPhone);
              }
              
              // Update last seen
              updateLastSeen(phoneNumber);
            }
          }
        }
        
        // PRIORITY 3: If we have a messaging binding name, use it (rarely available)
        if (!customer.name || customer.name === 'Unknown Customer') {
          if (participant.messagingBinding?.name) {
            customer.name = participant.messagingBinding.name;
            console.log('✅ Using messaging binding name:', participant.messagingBinding.name);
          }
        }
        
        // PRIORITY 4: If identity looks like a phone number, use it
        if (!customer.phoneNumber && identity && identity.match(/^\+?[1-9]\d{1,14}$/)) {
          customer.phoneNumber = identity;
          if (!customer.name || customer.name === 'Unknown Customer') {
            customer.name = `Customer ${identity.slice(-4)}`; // Show last 4 digits
          }
        }
        
        // PRIORITY 5: If identity looks like an email, use it
        if (!customer.email && identity && identity.includes('@')) {
          customer.email = identity;
          if (!customer.name || customer.name === 'Unknown Customer') {
            customer.name = identity.split('@')[0]; // Use email prefix as name
          }
        }
        
        // Set last seen to now for demo purposes if not already set
        if (!customer.lastSeen) {
          customer.lastSeen = new Date().toISOString();
        }
      }

  userCache.set(identity, user);
  return user;
}


export async function getTwilioConversations(loggedInAgentId: string, limit: number = 20, conversationId?: string, messageLimit: number = 100): Promise<Chat[]> {
  try {
    // Check cache first
    const cacheKey = `${loggedInAgentId}-${limit}-${conversationId || 'all'}-${messageLimit}`;
    const cached = conversationCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log("📦 Using cached conversations");
      return cached.data;
    }

    console.log("Creating Twilio client...");
    const twilioClient = await getTwilioClient();
    console.log("Fetching conversations...");
    
    let conversations;
    if (conversationId) {
      // Fetch specific conversation
      console.log("Fetching specific conversation:", conversationId);
      const conversation = await twilioClient.conversations.v1.conversations(conversationId).fetch();
      conversations = [conversation];
    } else {
      // Fetch all conversations
      conversations = await twilioClient.conversations.v1.conversations.list({ 
        limit: Math.min(limit, 50) // Cap at 50 to prevent excessive memory usage
      });
    }
    console.log("Found conversations:", conversations.length);
    const chats: Chat[] = [];

    // Process conversations in parallel for better performance
    const conversationPromises = conversations.map(async (convo) => {
      // Check participant cache first
      const participantCacheKey = `participants-${convo.sid}`;
      const cachedParticipants = participantCache.get(participantCacheKey);
      let participants;
      
      if (cachedParticipants && (now - cachedParticipants.timestamp) < PARTICIPANT_CACHE_DURATION) {
        console.log("📦 Using cached participants for:", convo.sid);
        participants = cachedParticipants.data;
      } else {
        participants = await twilioClient.conversations.v1.conversations(convo.sid).participants.list();
        participantCache.set(participantCacheKey, { data: participants, timestamp: now });
      }
      
      const agentParticipant = participants.find(p => p.identity?.startsWith('agent-'));
      const customerParticipant = participants.find(p => !p.identity?.startsWith('agent-'));

      let customer: Customer;
      if (!customerParticipant) {
        console.log("⚠️ No customer participant found for conversation:", convo.sid);
        // Create a default customer for conversations without participants
        customer = {
          id: 'unknown',
          name: 'Unknown Customer',
          avatar: 'https://ui-avatars.com/api/?name=Unknown&background=random',
          phoneNumber: undefined,
          email: undefined,
          lastSeen: undefined,
        };
      } else {
        customer = await getUserDetails(customerParticipant.identity!, false, customerParticipant) as Customer;
      }
      
      let agent: Agent;
      if (agentParticipant) {
        agent = await getUserDetails(agentParticipant.identity!, true, agentParticipant) as Agent;
      } else {
        // If no agent is assigned, assign it to the logged-in agent for now.
        // In a real app, you'd have a pool of available agents to choose from.
        const defaultAgent = {
          id: loggedInAgentId,
          name: 'Agent',
          username: loggedInAgentId,
          avatar: 'https://ui-avatars.com/api/?name=Agent&background=random',
          email: `${loggedInAgentId}@company.com`,
          status: 'online' as const,
          maxConcurrentChats: 10,
          currentChats: 0,
          skills: ['customer-support'],
          department: 'Customer Success',
          lastActive: new Date().toISOString(),
          role: 'agent' as const,
          permissions: {
            dashboard: true,
            agents: true,
            contacts: true,
            analytics: true,
            settings: true
          }
        };
        try {
          await twilioClient.conversations.v1.conversations(convo.sid).participants.create({ identity: defaultAgent.id });
          agent = defaultAgent;
        } catch (e: any) {
            // It's possible the agent is already being added, so we can ignore the error
            if (e.code === 50433) { // Participant already exists
                agent = defaultAgent as Agent;
            } else {
                console.error(`Failed to add agent to conversation ${convo.sid}:`, e);
                // Fallback to a default agent for UI purposes if adding fails
                agent = defaultAgent as Agent; 
            }
        }
      }

      // Check message cache first
      const messageCacheKey = `messages-${convo.sid}-${messageLimit}`;
      const cachedMessages = messageCache.get(messageCacheKey);
      let twilioMessages;
      
      if (cachedMessages && (now - cachedMessages.timestamp) < MESSAGE_CACHE_DURATION) {
        console.log("📦 Using cached messages for:", convo.sid);
        twilioMessages = cachedMessages.data;
      } else {
        // Fetch messages with configurable limit
        twilioMessages = await twilioClient.conversations.v1.conversations(convo.sid).messages.list({ 
          limit: messageLimit // Configurable message limit for full chat history
        });
        messageCache.set(messageCacheKey, { data: twilioMessages, timestamp: now });
      }
      const messages: Message[] = twilioMessages.map((msg) => {
        const senderIdentity = msg.author;
        // Check if it's an agent message
        // Agent messages have author like "admin_001" or "agent-xxx"
        // WhatsApp messages have author like "whatsapp:+1234567890"
        const isAgentMessage = senderIdentity && (
          senderIdentity.startsWith('agent-') || 
          senderIdentity.startsWith('agent_') ||
          senderIdentity === loggedInAgentId ||
          senderIdentity === 'admin_001' // Fallback for admin
        );
        const senderType = isAgentMessage ? 'agent' : 'customer';
        
        // Check for media attachments (Option 1: Twilio-only storage)
        const mediaType = msg.attributes ? 
          (JSON.parse(msg.attributes).mediaType || null) : null;
        const mediaUrl = msg.attributes ? 
          (JSON.parse(msg.attributes).mediaUrl || null) : null;
        const mediaContentType = msg.attributes ? 
          (JSON.parse(msg.attributes).mediaContentType || null) : null;
        const mediaFileName = msg.attributes ? 
          (JSON.parse(msg.attributes).mediaFileName || null) : null;
        const mediaCaption = msg.attributes ? 
          (JSON.parse(msg.attributes).mediaCaption || null) : null;
        
        // Handle multiple media items from Twilio
        const mediaItems = [];
        if (msg.attachedMedia && msg.attachedMedia.length > 0) {
          // Use Twilio's attachedMedia array
          msg.attachedMedia.forEach((media: any) => {
            mediaItems.push({
              url: media.links?.contentDirect || media.mediaUrl || media.url,
              contentType: media.contentType || media.type,
              filename: media.filename
            });
          });
        } else if (mediaUrl && mediaContentType) {
          // Fallback to single media from attributes
          mediaItems.push({
            url: mediaUrl,
            contentType: mediaContentType,
            filename: mediaFileName
          });
        }
        
        return {
          id: msg.sid,
          text: msg.body ?? '',
          timestamp: msg.dateCreated ? new Date(msg.dateCreated).toISOString() : new Date().toISOString(),
          sender: senderType,
          senderId: senderIdentity || 'customer',
          // Delivery status for agent messages
          deliveryStatus: senderType === 'agent' ? 'sent' : undefined,
          twilioMessageSid: msg.sid,
          // Media fields (Option 1: Twilio-only storage)
          mediaType: mediaType as 'image' | 'video' | 'audio' | 'document' | undefined,
          mediaUrl: mediaUrl || undefined,
          mediaContentType: mediaContentType || undefined,
          mediaFileName: mediaFileName || undefined,
          mediaCaption: mediaCaption || undefined,
          // New media array for multiple media items
          media: mediaItems.length > 0 ? mediaItems : undefined,
        };
      });

      // Sort messages by timestamp ascending (using string comparison to avoid Date objects)
      messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      // Extract proxyAddress from customer participant to identify which number this conversation uses
      // Twilio returns proxy_address (snake_case), not proxyAddress (camelCase)
      let proxyAddress: string | undefined;
      let twilioNumberId: string | undefined;
      
      if (customerParticipant?.messagingBinding?.proxy_address) {
        proxyAddress = customerParticipant.messagingBinding.proxy_address;
        
        // Try to match proxyAddress to configured numbers
        try {
          const { getNumberByPhone } = await import('./multi-number-config');
          const matchedNumber = proxyAddress ? getNumberByPhone(proxyAddress) : null;
          if (matchedNumber) {
            twilioNumberId = matchedNumber.id;
            console.log(`✅ Matched proxyAddress ${proxyAddress} to number: ${matchedNumber.name} (ID: ${matchedNumber.id})`);
          } else {
            console.warn(`⚠️ No match found for proxyAddress: ${proxyAddress}. Configured numbers:`, 
              (await import('./multi-number-config')).getConfiguredNumbers().map(n => n.number));
          }
        } catch (e) {
          console.warn('Could not match proxyAddress to configured number:', e);
        }
      } else {
        console.warn(`⚠️ No proxyAddress found for conversation ${convo.sid}`);
      }

      // Always return conversation, even if no messages (for new conversations)
      return {
        id: convo.sid,
        customer,
        agent,
        messages,
        unreadCount: 0, // Twilio unread count is per-user, simplifying for now
        status: 'open' as const,
        proxyAddress,
        twilioNumberId,
        priority: 'medium' as const,
        tags: [],
        createdAt: convo.dateCreated ? new Date(convo.dateCreated).toISOString() : new Date().toISOString(),
        updatedAt: convo.dateUpdated ? new Date(convo.dateUpdated).toISOString() : new Date().toISOString(),
        assignedAt: agentParticipant ? new Date(agentParticipant.dateCreated).toISOString() : new Date().toISOString(),
      };
    });

    // Wait for all conversations to be processed in parallel
    const conversationResults = await Promise.all(conversationPromises);
    const validChats = conversationResults.filter(chat => chat !== null) as Chat[];
    chats.push(...validChats);

    // Ensure all data is serializable before returning
    const serializedChats = chats.map(chat => ({
      id: String(chat.id),
      customer: {
        id: chat.customer.id ? String(chat.customer.id) : '',
        name: String(chat.customer.name || 'Anonymous'),
        avatar: String(chat.customer.avatar || ''),
        phoneNumber: chat.customer.phoneNumber ? String(chat.customer.phoneNumber) : undefined,
        email: chat.customer.email ? String(chat.customer.email) : undefined,
        lastSeen: chat.customer.lastSeen ? String(chat.customer.lastSeen) : undefined,
      },
      agent: {
        id: String(chat.agent.id),
        name: String(chat.agent.name),
        avatar: String(chat.agent.avatar),
        username: chat.agent.username ? String(chat.agent.username) : String(chat.agent.id),
        email: chat.agent.email ? String(chat.agent.email) : undefined,
        status: chat.agent.status as 'online' | 'offline' | 'busy' | 'away',
        maxConcurrentChats: Number(chat.agent.maxConcurrentChats),
        currentChats: Number(chat.agent.currentChats),
        skills: chat.agent.skills ? chat.agent.skills.map(String) : undefined,
        department: chat.agent.department ? String(chat.agent.department) : undefined,
        lastActive: chat.agent.lastActive ? String(chat.agent.lastActive) : undefined,
        role: (chat.agent.role === 'admin' || chat.agent.role === 'agent') ? chat.agent.role : 'agent' as 'admin' | 'agent',
        permissions: chat.agent.permissions || {
          dashboard: true,
          agents: true,
          contacts: true,
          analytics: true,
          settings: true
        },
      },
      messages: chat.messages.map(message => ({
        id: String(message.id),
        text: String(message.text),
        timestamp: String(message.timestamp),
        sender: message.sender as 'agent' | 'customer',
        senderId: String(message.senderId),
      })),
      unreadCount: Number(chat.unreadCount),
      status: chat.status as 'open' | 'closed' | 'pending' | 'resolved' | 'escalated',
      priority: chat.priority as 'low' | 'medium' | 'high' | 'urgent',
      tags: chat.tags ? chat.tags.map(String) : undefined,
      createdAt: String(chat.createdAt),
      updatedAt: String(chat.updatedAt),
      assignedAt: chat.assignedAt ? String(chat.assignedAt) : undefined,
      closedAt: chat.closedAt ? String(chat.closedAt) : undefined,
      closedBy: chat.closedBy ? String(chat.closedBy) : undefined,
      notes: chat.notes ? String(chat.notes) : undefined,
      proxyAddress: chat.proxyAddress ? String(chat.proxyAddress) : undefined,
      twilioNumberId: chat.twilioNumberId ? String(chat.twilioNumberId) : undefined,
    }));

    const sortedChats = serializedChats.sort((a,b) => {
      // First, prioritize open conversations
      const aOpen = a.status === 'open';
      const bOpen = b.status === 'open';
      
      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;
      
      // Then sort by timestamp (most recent first)
      const aTimestamp = a.messages[a.messages.length - 1]?.timestamp || '0';
      const bTimestamp = b.messages[b.messages.length - 1]?.timestamp || '0';
      return bTimestamp.localeCompare(aTimestamp);
    });

    // Cache the results
    conversationCache.set(cacheKey, {
      data: sortedChats,
      timestamp: now
    });

    return sortedChats;
  } catch (error) {
    console.error("Error fetching Twilio conversations:", error);
    // Re-throwing the error to make it visible in the UI during development
    if (error instanceof Error) {
        throw new Error(`Twilio Service Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching Twilio conversations.");
  }
}

export async function sendTwilioMessage(conversationSid: string, author: string, text: string) {
    try {
        console.log("Attempting to send message:", { conversationSid, author, text });
        const twilioClient = await getTwilioClient();
        console.log("Twilio client created successfully");
        
        // First, get the conversation to find the customer's WhatsApp number
        const conversation = await twilioClient.conversations.v1.conversations(conversationSid).fetch();
        const participants = await twilioClient.conversations.v1.conversations(conversationSid).participants.list();
        
        console.log("All participants:", participants.map(p => ({ identity: p.identity, address: p.messagingBinding?.address })));
        
        // Find the customer participant (not the agent)
        // Customer participants typically have null identity but have messagingBinding.address
        const customerParticipant = participants.find(p => 
          p.messagingBinding?.address && 
          (!p.identity || (!p.identity.startsWith('agent-') && !p.identity.startsWith('admin') &&
                          !p.identity.startsWith('agent_') && !p.identity.startsWith('admin_')))
        );
        
        if (!customerParticipant || !customerParticipant.messagingBinding?.address) {
            throw new Error("Could not find customer WhatsApp number in conversation");
        }
        
        const customerWhatsAppNumber = customerParticipant.messagingBinding.address; // e.g., "whatsapp:+201016666348"
        console.log("Customer WhatsApp number:", customerWhatsAppNumber);
        
        // Ensure the agent is a participant in the conversation
        const agentParticipant = participants.find(p => p.identity === author);
        if (!agentParticipant) {
            console.log("Adding agent as participant to conversation");
            await twilioClient.conversations.v1.conversations(conversationSid).participants.create({
                identity: author
            });
        }
        
        // Use Twilio Conversations API for WhatsApp delivery
        const conversationMessage = await twilioClient.conversations.v1.conversations(conversationSid).messages.create({
            author,
            body: text,
        });
        
        console.log("Conversation message sent successfully:", conversationMessage.sid);
        
        // Generate message ID for our database
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store the sent message in our database
        try {
            const { getDatabase } = await import('@/lib/database-config');
            const db = await getDatabase();
            
            await db.createMessage({
                id: messageId,
                conversation_id: conversationSid,
                sender_id: author,
                sender_type: 'agent',
                content: text,
                message_type: 'text',
                twilio_message_sid: conversationMessage.sid,
                delivery_status: 'sent',
                created_at: new Date().toISOString()
            });
            
            console.log('✅ Sent message stored in database:', messageId);
            
            // Mark conversation as not new since agent has now replied
            await db.updateConversation(conversationSid, { is_new: 0 });
            console.log('✅ Conversation marked as not new (agent replied)');
            
            // Note: SSE broadcast is handled by the webhook handler
            // to avoid duplicate messages. The webhook will broadcast when
            // Twilio confirms the message was sent.
            console.log('✅ Message stored in database, webhook will handle SSE broadcast');
        } catch (dbError) {
            console.error('❌ Failed to store sent message in database:', dbError);
            // Don't fail the entire operation if database storage fails
        }
        
        // Return success object
        return {
            success: true,
            messageId: messageId, // Our internal message ID
            twilioMessageSid: conversationMessage.sid, // Twilio message SID for tracking
            message: conversationMessage
        };
    } catch (error: any) {
        console.error("Detailed error sending Twilio message:", {
            error: error.message,
            code: error.code,
            status: error.status,
            moreInfo: error.moreInfo,
            conversationSid,
            author,
            text
        });
        throw new Error(`Failed to send message: ${error.message || 'Unknown error'}`);
    }
}

export async function reassignTwilioConversation(conversationSid: string, newAgentId: string) {
  try {
    console.log('🔄 Reassigning conversation:', { conversationSid, newAgentId });
    const twilioClient = await getTwilioClient();
    const participants = await twilioClient.conversations.v1.conversations(conversationSid).participants.list();
    
    console.log('📋 Current participants:', participants.map(p => ({ identity: p.identity, sid: p.sid })));
    
    // Find and remove the current agent (look for various agent ID formats)
    const currentAgent = participants.find(p => 
      p.identity && (
        p.identity.startsWith('agent-') || 
        p.identity.startsWith('agent_') ||
        p.identity.startsWith('admin_') ||
        p.identity === 'admin_001' ||
        p.identity.includes('agent')
      )
    );
    
    if (currentAgent) {
      console.log('🗑️ Removing current agent:', currentAgent.identity);
      await twilioClient.conversations.v1.conversations(conversationSid).participants(currentAgent.sid).remove();
    } else {
      console.log('ℹ️ No current agent found to remove');
    }
    
    // Add the new agent
    console.log('➕ Adding new agent:', newAgentId);
    await twilioClient.conversations.v1.conversations(conversationSid).participants.create({ identity: newAgentId });
    console.log('✅ Agent assignment completed');

  } catch (error) {
    console.error(`❌ Error reassigning conversation ${conversationSid} to ${newAgentId}:`, error);
    throw new Error(`Failed to reassign agent in Twilio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
