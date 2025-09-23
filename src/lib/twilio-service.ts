'use server';

import type { Agent, Chat, Customer, Message } from '@/types';
import { twilioClient } from './twilio-config';
import { PlaceHolderImages } from './placeholder-images';

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


export async function getTwilioConversations(agentIdentity: string): Promise<Chat[]> {
  try {
    const conversations = await twilioClient.conversations.v1.conversations.list({ limit: 50 });
    const chats: Chat[] = [];

    for (const convo of conversations) {
      const participants = await twilioClient.conversations.v1.conversations(convo.sid).participants.list();
      
      const agentParticipant = participants.find(p => p.identity === agentIdentity);
      // Find the first participant who is not the logged-in agent
      const customerParticipant = participants.find(p => p.identity !== agentIdentity);

      if (!agentParticipant || !customerParticipant) {
        // Skip conversations that don't have both an agent and a customer
        continue;
      }
      
      const agent = await getUserDetails(agentParticipant.identity!, true) as Agent;
      const customer = await getUserDetails(customerParticipant.identity!, false) as Customer;

      const twilioMessages = await twilioClient.conversations.v1.conversations(convo.sid).messages.list({ limit: 100 });
      const messages: Message[] = await Promise.all(
        twilioMessages.map(async (msg) => {
          const senderIdentity = msg.author;
          const senderType = senderIdentity === agent.id ? 'agent' : 'customer';
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

    return chats;
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
