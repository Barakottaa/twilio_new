'use server';

import type { Agent, Chat, Customer, Message } from '@/types';
import twilio from 'twilio';
import { PlaceHolderImages } from './placeholder-images';
import { availableAgents } from './mock-data';
import { getContact, getDisplayName, formatPhoneNumber, updateLastSeen } from './contact-mapping';

// A map to cache agent and customer details to avoid repeated lookups
const userCache = new Map<string, Agent | Customer>();

function getTwilioClient() {
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

async function getUserDetails(identity: string, isAgent: boolean, participant?: any): Promise<Agent | Customer> {
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
    avatar: isAgent ? PlaceHolderImages[Math.floor(Math.random() * 4)].imageUrl : PlaceHolderImages[4 + Math.floor(Math.random() * 6)].imageUrl,
  };

  // For agents, use the identity as name
  if (isAgent) {
    user.name = identity || 'Unknown Agent';
  } else {
    // For customers, we'll extract the real name from participant data below
    user.name = 'Unknown Customer';
  }

  // If it's a customer and we have participant data, try to extract contact info
  if (!isAgent && participant) {
    const customer = user as Customer;
    
    // Try to extract phone number from participant attributes or identity
    if (participant.attributes) {
      try {
        const attrs = JSON.parse(participant.attributes);
        customer.phoneNumber = attrs.phoneNumber || attrs.phone || attrs.contact;
        customer.email = attrs.email;
        customer.name = attrs.friendlyName || attrs.name || customer.name;
      } catch (e) {
        // If attributes parsing fails, continue with defaults
      }
    }
    
    // Extract phone number from WhatsApp messaging binding
    if (participant.messagingBinding?.address) {
      const address = participant.messagingBinding.address;
      // Extract phone number from "whatsapp:+1234567890" format
      const phoneMatch = address.match(/whatsapp:(\+?\d+)/);
      if (phoneMatch) {
        const phoneNumber = phoneMatch[1];
        customer.phoneNumber = phoneNumber;
        
        // Try to get contact info from our mapping
        console.log('🔍 Looking up contact for phone:', phoneNumber);
        const contactInfo = getContact(phoneNumber);
        console.log('📞 Contact info found:', contactInfo);
        
        if (contactInfo) {
          customer.name = contactInfo.name;
          customer.avatar = contactInfo.avatar || customer.avatar;
          customer.lastSeen = contactInfo.lastSeen;
          console.log('✅ Using mapped contact name:', contactInfo.name);
        } else {
          // Fallback to formatted phone number
          const formattedPhone = formatPhoneNumber(phoneNumber);
          customer.name = formattedPhone;
          console.log('📱 Using formatted phone as name:', formattedPhone);
        }
        
        // Update last seen
        updateLastSeen(phoneNumber);
      }
    }
    
    // If we have a messaging binding name, use it (rarely available)
    if (participant.messagingBinding?.name) {
      customer.name = participant.messagingBinding.name;
    }
    
    // If identity looks like a phone number, use it
    if (!customer.phoneNumber && identity && identity.match(/^\+?[1-9]\d{1,14}$/)) {
      customer.phoneNumber = identity;
      customer.name = `Customer ${identity.slice(-4)}`; // Show last 4 digits
    }
    
    // If identity looks like an email, use it
    if (!customer.email && identity && identity.includes('@')) {
      customer.email = identity;
      customer.name = identity.split('@')[0]; // Use email prefix as name
    }
    
    // Set last seen to now for demo purposes
    customer.lastSeen = new Date().toISOString();
  }

  userCache.set(identity, user);
  return user;
}


export async function getTwilioConversations(loggedInAgentId: string): Promise<Chat[]> {
  try {
    console.log("Creating Twilio client...");
    const twilioClient = getTwilioClient();
    console.log("Fetching conversations...");
    const conversations = await twilioClient.conversations.v1.conversations.list({ limit: 50 });
    console.log("Found conversations:", conversations.length);
    const chats: Chat[] = [];

    for (const convo of conversations) {
      const participants = await twilioClient.conversations.v1.conversations(convo.sid).participants.list();
      
      const agentParticipant = participants.find(p => p.identity?.startsWith('agent-'));
      const customerParticipant = participants.find(p => !p.identity?.startsWith('agent-'));

      if (!customerParticipant) {
        continue;
      }
      
      const customer = await getUserDetails(customerParticipant.identity!, false, customerParticipant) as Customer;
      
      let agent: Agent;
      if (agentParticipant) {
        agent = await getUserDetails(agentParticipant.identity!, true, agentParticipant) as Agent;
      } else {
        // If no agent is assigned, assign it to the logged-in agent for now.
        // In a real app, you'd have a pool of available agents to choose from.
        const defaultAgent = availableAgents.find(a => a.id === loggedInAgentId) || availableAgents[0];
        try {
          await twilioClient.conversations.v1.conversations(convo.sid).participants.create({ identity: defaultAgent.id });
          agent = defaultAgent;
        } catch (e: any) {
            // It's possible the agent is already being added, so we can ignore the error
            if (e.code === 50433) { // Participant already exists
                agent = defaultAgent;
            } else {
                console.error(`Failed to add agent to conversation ${convo.sid}:`, e);
                // Fallback to a default agent for UI purposes if adding fails
                agent = defaultAgent; 
            }
        }
      }

      const twilioMessages = await twilioClient.conversations.v1.conversations(convo.sid).messages.list({ limit: 100 });
      const messages: Message[] = await Promise.all(
        twilioMessages.map(async (msg) => {
          const senderIdentity = msg.author;
          const senderType = senderIdentity.startsWith('agent-') ? 'agent' : 'customer';
          return {
            id: msg.sid,
            text: msg.body ?? '',
            timestamp: msg.dateCreated ? new Date(msg.dateCreated).toISOString() : new Date().toISOString(),
            sender: senderType,
            senderId: senderIdentity,
          };
        })
      );

      // Sort messages by timestamp ascending (using string comparison to avoid Date objects)
      messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      if (messages.length > 0) {
        chats.push({
          id: convo.sid,
          customer,
          agent,
          messages,
          unreadCount: 0, // Twilio unread count is per-user, simplifying for now
        });
      }
    }

    // Ensure all data is serializable before returning
    const serializedChats = chats.map(chat => ({
      id: String(chat.id),
      customer: {
        id: chat.customer.id ? String(chat.customer.id) : null,
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
      },
      messages: chat.messages.map(message => ({
        id: String(message.id),
        text: String(message.text),
        timestamp: String(message.timestamp),
        sender: String(message.sender),
        senderId: String(message.senderId),
      })),
      unreadCount: Number(chat.unreadCount),
    }));

    return serializedChats.sort((a,b) => {
      const aTimestamp = a.messages[a.messages.length - 1]?.timestamp || '0';
      const bTimestamp = b.messages[b.messages.length - 1]?.timestamp || '0';
      return bTimestamp.localeCompare(aTimestamp);
    });
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
        const twilioClient = getTwilioClient();
        console.log("Twilio client created successfully");
        
        const message = await twilioClient.conversations.v1.conversations(conversationSid).messages.create({
            author,
            body: text,
        });
        
        console.log("Message sent successfully:", message.sid);
        
        // Return only plain object properties
        return {
            sid: message.sid,
            author: message.author,
            body: message.body,
            dateCreated: message.dateCreated ? new Date(message.dateCreated).toISOString() : null,
            index: message.index,
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
    const twilioClient = getTwilioClient();
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
