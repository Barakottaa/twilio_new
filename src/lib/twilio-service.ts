'use server';

import type { Agent, Chat, Customer, Message } from '@/types';
import { twilioClient } from './twilio-config';
import { PlaceHolderImages } from './placeholder-images';
import { availableAgents } from './mock-data';

// A map to cache agent and customer details to avoid repeated lookups
const userCache = new Map<string, Agent | Customer>();

async function getUserDetails(identity: string, isAgent: boolean): Promise<Agent | Customer> {
  if (userCache.has(identity)) {
    return userCache.get(identity)!;
  }

  // In a real app, you'd fetch user details from your database
  // For now, we'll create placeholder users and cache them.
  const user: Agent | Customer = {
    id: identity,
    name: identity,
    avatar: isAgent ? PlaceHolderImages[Math.floor(Math.random() * 4)].imageUrl : PlaceHolderImages[4 + Math.floor(Math.random() * 6)].imageUrl,
  };
  userCache.set(identity, user);
  return user;
}


export async function getTwilioConversations(loggedInAgentId: string): Promise<Chat[]> {
  try {
    const conversations = await twilioClient.conversations.v1.conversations.list({ limit: 50 });
    const chats: Chat[] = [];

    for (const convo of conversations) {
      const participants = await twilioClient.conversations.v1.conversations(convo.sid).participants.list();
      
      const agentParticipant = participants.find(p => p.identity?.startsWith('agent-'));
      const customerParticipant = participants.find(p => !p.identity?.startsWith('agent-'));

      if (!customerParticipant) {
        continue;
      }
      
      const customer = await getUserDetails(customerParticipant.identity!, false) as Customer;
      
      let agent: Agent;
      if (agentParticipant) {
        agent = await getUserDetails(agentParticipant.identity!, true) as Agent;
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
            timestamp: msg.dateCreated.toISOString(),
            sender: senderType,
            senderId: senderIdentity,
          };
        })
      );

      // Sort messages by timestamp ascending
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      chats.push({
        id: convo.sid,
        customer,
        agent,
        messages,
        unreadCount: 0, // Twilio unread count is per-user, simplifying for now
      });
    }

    return chats.sort((a,b) => {
      const aDate = new Date(a.messages[a.messages.length - 1]?.timestamp || 0);
      const bDate = new Date(b.messages[b.messages.length - 1]?.timestamp || 0);
      return bDate.getTime() - aDate.getTime();
    });
  } catch (error) {
    console.error("Error fetching Twilio conversations:", error);
    return [];
  }
}

export async function sendTwilioMessage(conversationSid: string, author: string, text: string) {
    try {
        const message = await twilioClient.conversations.v1.conversations(conversationSid).messages.create({
            author,
            body: text,
        });
        return message;
    } catch (error) {
        console.error("Error sending Twilio message:", error);
        throw new Error("Failed to send message.");
    }
}
