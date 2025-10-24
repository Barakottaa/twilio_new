'use server';

import type { Agent, ConversationStatus } from '@/types';
// In-memory agent management (in production, this would be a database)
let agents: Agent[] = [];

export async function getAllAgents(): Promise<Agent[]> {
  return agents;
}

export async function getAgentById(id: string): Promise<Agent | null> {
  return agents.find(agent => agent.id === id) || null;
}

export async function createAgent(agentData: Omit<Agent, 'id' | 'currentChats'>): Promise<Agent> {
  const newAgent: Agent = {
    ...agentData,
    id: `agent-${Date.now()}`,
    currentChats: 0,
  };
  
  agents.push(newAgent);
  return newAgent;
}

export async function updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | null> {
  const agentIndex = agents.findIndex(agent => agent.id === id);
  if (agentIndex === -1) return null;
  
  agents[agentIndex] = { ...agents[agentIndex], ...updates };
  return agents[agentIndex];
}

export async function deleteAgent(id: string): Promise<boolean> {
  const agentIndex = agents.findIndex(agent => agent.id === id);
  if (agentIndex === -1) return false;
  
  agents.splice(agentIndex, 1);
  return true;
}

export async function updateAgentStatus(id: string, status: Agent['status']): Promise<Agent | null> {
  return updateAgent(id, { status, lastActive: new Date().toISOString() });
}

export async function getAvailableAgents(): Promise<Agent[]> {
  return agents.filter(agent => 
    agent.status === 'online' && 
    agent.currentChats < agent.maxConcurrentChats
  );
}

export async function getAgentsByDepartment(department: string): Promise<Agent[]> {
  return agents.filter(agent => agent.department === department);
}

export async function getAgentsBySkill(skill: string): Promise<Agent[]> {
  return agents.filter(agent => agent.skills?.includes(skill));
}

export async function incrementAgentChatCount(agentId: string): Promise<void> {
  const agent = agents.find(a => a.id === agentId);
  if (agent && agent.currentChats < agent.maxConcurrentChats) {
    agent.currentChats += 1;
  }
}

export async function decrementAgentChatCount(agentId: string): Promise<void> {
  const agent = agents.find(a => a.id === agentId);
  if (agent && agent.currentChats > 0) {
    agent.currentChats -= 1;
  }
}

export async function getAgentStats(): Promise<{
  total: number;
  online: number;
  busy: number;
  away: number;
  offline: number;
  totalCapacity: number;
  usedCapacity: number;
}> {
  const total = agents.length;
  const online = agents.filter(a => a.status === 'online').length;
  const busy = agents.filter(a => a.status === 'busy').length;
  const away = agents.filter(a => a.status === 'away').length;
  const offline = agents.filter(a => a.status === 'offline').length;
  const totalCapacity = agents.reduce((sum, agent) => sum + agent.maxConcurrentChats, 0);
  const usedCapacity = agents.reduce((sum, agent) => sum + agent.currentChats, 0);

  return {
    total,
    online,
    busy,
    away,
    offline,
    totalCapacity,
    usedCapacity,
  };
}
