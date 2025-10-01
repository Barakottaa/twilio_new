'use server';

import type { Agent, Chat, Customer, Message } from '@/types';
import twilio from 'twilio';
import { PlaceHolderImages } from './placeholder-images';
import { getContact, getDisplayName, formatPhoneNumber, updateLastSeen, getAllContacts, addContact } from './contact-mapping';

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
  console.log('🗑️ Conversation cache invalidated');
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
  const client = await getTwilioClient();
  const opts: any = { limit: Math.min(limit, 50) };
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
        return !p.identity.startsWith('agent-') && !p.identity.startsWith('admin-');
      });
      
      const agentParticipant = participants.find(p => 
        p.identity && (p.identity.startsWith('agent-') || p.identity.startsWith('admin-'))
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
              console.log('🔍 Found contact in database:', { phone: customerPhone, name: customerName });
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
      }
      
      let agentName = 'Unassigned';
      let agentId = 'unassigned';
      let agentStatus = 'offline';
      
      // First, check if there's an assignment in our database
      try {
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
            console.log('🔍 Found database assignment:', { conversationId: c.sid, agentId, agentName });
          }
        }
      } catch (error) {
        console.log('🔍 Error checking database assignment:', error);
      }
      
      // If no database assignment found, check Twilio participants
      if (agentId === 'unassigned' && agentParticipant) {
        agentId = agentParticipant.identity || 'unassigned';
        try {
          const attributes = agentParticipant.attributes ? 
            JSON.parse(agentParticipant.attributes) : {};
          agentName = attributes.display_name || agentParticipant.identity || 'Unassigned';
          agentStatus = attributes.status || 'offline';
        } catch {
          agentName = agentParticipant.identity || 'Unassigned';
        }
      }
      
      const conversationItem = {
        id: c.sid,
        title: customerName,
        lastMessagePreview: '', // Will be populated when messages are loaded
        unreadCount: 0, // Twilio doesn't provide this easily, defaulting to 0
        createdAt: c.dateCreated?.toISOString?.() ?? new Date().toISOString(),
        updatedAt: c.dateUpdated?.toISOString?.() ?? c.dateCreated?.toISOString?.() ?? new Date().toISOString(),
        customerId: customerParticipant?.identity || 'unknown',
        agentId: agentId,
        // Additional information for enhanced display
        customerPhone: customerPhone,
        customerEmail: customerEmail,
        agentName: agentName,
        agentStatus: agentStatus,
        status: 'open' as const, // Default status
        priority: 'medium' as const, // Default priority
      };
      console.log('🔍 Created conversation item:', conversationItem);
      return conversationItem;
    } catch (error) {
      console.error('Error fetching participants for conversation:', c.sid, error);
      // Fallback to basic info
      return {
        id: c.sid,
        title: c.friendlyName || c.sid,
        lastMessagePreview: '',
        unreadCount: 0,
        createdAt: c.dateCreated?.toISOString?.() ?? new Date().toISOString(),
        updatedAt: c.dateUpdated?.toISOString?.() ?? c.dateCreated?.toISOString?.() ?? new Date().toISOString(),
        customerId: 'unknown',
        agentId: 'unknown',
      };
    }
  }));
  
  const nextCursor = page.nextPageUrl ? page.nextPageUrl.match(/PageToken=([^&]+)/)?.[1] : undefined;
  return { items, nextCursor };
}

export async function listMessages(conversationId: string, limit = 25, before?: string) {
  console.log('🔍 listMessages called with:', { conversationId, limit, before });
  const client = await getTwilioClient();
  const convo = client.conversations.v1.conversations(conversationId);
  const opts: any = { limit: Math.min(limit, 100) };
  if (before) opts.pageToken = before; // simplistic cursor using Twilio pages
  const page = await convo.messages.page(opts);
  console.log('🔍 Twilio messages page:', { count: page.instances.length, hasMore: !!page.nextPageUrl });
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
    const mappedMessage = {
      id: msg.sid,
      text: msg.body ?? '',
      timestamp: msg.dateCreated ? new Date(msg.dateCreated).toISOString() : new Date().toISOString(),
      sender,
      senderId,
      media: mediaArr.length ? mediaArr : undefined
    };
    console.log('🔍 Mapped message:', { id: mappedMessage.id, text: mappedMessage.text, sender: mappedMessage.sender, senderId: mappedMessage.senderId });
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

      // Always return conversation, even if no messages (for new conversations)
      return {
        id: convo.sid,
        customer,
        agent,
        messages,
        unreadCount: 0, // Twilio unread count is per-user, simplifying for now
        status: 'open' as const,
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
    }));

    const sortedChats = serializedChats.sort((a,b) => {
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
        
        // Find the customer participant (not the agent)
        const customerParticipant = participants.find(p => !p.identity?.startsWith('agent-'));
        
        if (!customerParticipant || !customerParticipant.messagingBinding?.address) {
            throw new Error("Could not find customer WhatsApp number in conversation");
        }
        
        const customerWhatsAppNumber = customerParticipant.messagingBinding.address; // e.g., "whatsapp:+201016666348"
        console.log("Customer WhatsApp number:", customerWhatsAppNumber);
        
        // Use Twilio Conversations API for WhatsApp delivery
        const conversationMessage = await twilioClient.conversations.v1.conversations(conversationSid).messages.create({
            author,
            body: text,
        });
        
        console.log("Conversation message sent successfully:", conversationMessage.sid);
        
        // Return success object
        return {
            success: true,
            messageId: conversationMessage.sid,
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
    const twilioClient = await getTwilioClient();
    const participants = await twilioClient.conversations.v1.conversations(conversationSid).participants.list();
    
    // Find and remove the current agent
    const currentAgent = participants.find(p => p.identity?.startsWith('agent-'));
    if (currentAgent) {
      await twilioClient.conversations.v1.conversations(conversationSid).participants(currentAgent.sid).remove();
    }
    
    // Add the new agent
    await twilioClient.conversations.v1.conversations(conversationSid).participants.create({ identity: newAgentId });

  } catch (error) {
    console.error(`Error reassigning conversation ${conversationSid} to ${newAgentId}:`, error);
    throw new Error("Failed to reassign agent in Twilio.");
  }
}
