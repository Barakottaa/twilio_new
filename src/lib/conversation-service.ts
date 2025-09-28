'use server';

import type { Chat, ConversationStatus, Agent } from '@/types';
import { updateAgentStatus, incrementAgentChatCount, decrementAgentChatCount } from './agent-service';

// In-memory conversation management (in production, this would be a database)
let conversations: Chat[] = [];

export async function getAllConversations(): Promise<Chat[]> {
  return conversations;
}

export async function getConversationById(id: string): Promise<Chat | null> {
  return conversations.find(conv => conv.id === id) || null;
}

export async function getConversationsByStatus(status: ConversationStatus): Promise<Chat[]> {
  return conversations.filter(conv => conv.status === status);
}

export async function getConversationsByAgent(agentId: string): Promise<Chat[]> {
  return conversations.filter(conv => conv.agent.id === agentId);
}

export async function getConversationsByPriority(priority: Chat['priority']): Promise<Chat[]> {
  return conversations.filter(conv => conv.priority === priority);
}

export async function updateConversationStatus(
  conversationId: string, 
  status: ConversationStatus,
  closedBy?: string
): Promise<Chat | null> {
  const conversation = conversations.find(conv => conv.id === conversationId);
  if (!conversation) return null;

  const now = new Date().toISOString();
  
  conversation.status = status;
  conversation.updatedAt = now;
  
  if (status === 'closed' || status === 'resolved') {
    conversation.closedAt = now;
    conversation.closedBy = closedBy;
    
    // Decrement agent's current chat count
    await decrementAgentChatCount(conversation.agent.id);
  }

  return conversation;
}

export async function assignConversation(
  conversationId: string, 
  agentId: string
): Promise<Chat | null> {
  const conversation = conversations.find(conv => conv.id === conversationId);
  if (!conversation) return null;

  // Decrement old agent's chat count if different
  if (conversation.agent.id !== agentId) {
    await decrementAgentChatCount(conversation.agent.id);
  }

  // Update conversation with new agent
  conversation.agent = { ...conversation.agent, id: agentId };
  conversation.assignedAt = new Date().toISOString();
  conversation.updatedAt = new Date().toISOString();

  // Increment new agent's chat count
  await incrementAgentChatCount(agentId);

  return conversation;
}

export async function updateConversationPriority(
  conversationId: string, 
  priority: Chat['priority']
): Promise<Chat | null> {
  const conversation = conversations.find(conv => conv.id === conversationId);
  if (!conversation) return null;

  conversation.priority = priority;
  conversation.updatedAt = new Date().toISOString();

  return conversation;
}

export async function addConversationTags(
  conversationId: string, 
  tags: string[]
): Promise<Chat | null> {
  const conversation = conversations.find(conv => conv.id === conversationId);
  if (!conversation) return null;

  conversation.tags = [...(conversation.tags || []), ...tags];
  conversation.updatedAt = new Date().toISOString();

  return conversation;
}

export async function removeConversationTags(
  conversationId: string, 
  tags: string[]
): Promise<Chat | null> {
  const conversation = conversations.find(conv => conv.id === conversationId);
  if (!conversation) return null;

  conversation.tags = conversation.tags?.filter(tag => !tags.includes(tag));
  conversation.updatedAt = new Date().toISOString();

  return conversation;
}

export async function addConversationNotes(
  conversationId: string, 
  notes: string
): Promise<Chat | null> {
  const conversation = conversations.find(conv => conv.id === conversationId);
  if (!conversation) return null;

  conversation.notes = notes;
  conversation.updatedAt = new Date().toISOString();

  return conversation;
}

export async function getConversationStats(): Promise<{
  total: number;
  open: number;
  closed: number;
  pending: number;
  resolved: number;
  escalated: number;
  byPriority: Record<Chat['priority'], number>;
}> {
  const total = conversations.length;
  const open = conversations.filter(c => c.status === 'open').length;
  const closed = conversations.filter(c => c.status === 'closed').length;
  const pending = conversations.filter(c => c.status === 'pending').length;
  const resolved = conversations.filter(c => c.status === 'resolved').length;
  const escalated = conversations.filter(c => c.status === 'escalated').length;

  const byPriority = {
    low: conversations.filter(c => c.priority === 'low').length,
    medium: conversations.filter(c => c.priority === 'medium').length,
    high: conversations.filter(c => c.priority === 'high').length,
    urgent: conversations.filter(c => c.priority === 'urgent').length,
  };

  return {
    total,
    open,
    closed,
    pending,
    resolved,
    escalated,
    byPriority,
  };
}

export async function searchConversations(query: string): Promise<Chat[]> {
  const lowercaseQuery = query.toLowerCase();
  
  return conversations.filter(conv => 
    conv.customer.name.toLowerCase().includes(lowercaseQuery) ||
    conv.customer.email?.toLowerCase().includes(lowercaseQuery) ||
    conv.customer.phoneNumber?.includes(query) ||
    conv.agent.name.toLowerCase().includes(lowercaseQuery) ||
    conv.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    conv.notes?.toLowerCase().includes(lowercaseQuery) ||
    conv.messages.some(msg => msg.text.toLowerCase().includes(lowercaseQuery))
  );
}

// Initialize with mock data
export async function initializeConversations(mockChats: Chat[]): Promise<void> {
  conversations = [...mockChats];
}
