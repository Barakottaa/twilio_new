'use server';

import { db } from './database';
import type { Agent } from '@/types';

export async function getAllAgents(): Promise<Agent[]> {
  try {
    const agents = await db.getAllAgents();
    return agents.map(agent => ({
      id: agent.id,
      username: agent.username,
      role: agent.role,
      permissions: agent.permissions
    }));
  } catch (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
}

export async function getAgentById(id: string): Promise<Agent | null> {
  try {
    const agent = await db.getAgent(id);
    if (!agent) return null;

    return {
      id: agent.id,
      username: agent.username,
      role: agent.role,
      permissions: agent.permissions
    };
  } catch (error) {
    console.error('Error fetching agent:', error);
    return null;
  }
}

export async function createAgent(data: {
  username: string;
  password: string;
  role: 'admin' | 'agent';
  permissions: {
    dashboard: boolean;
    agents: boolean;
    contacts: boolean;
    analytics: boolean;
    settings: boolean;
  };
}): Promise<Agent | null> {
  try {
    const agent = await db.createAgent({
      username: data.username,
      password: data.password,
      role: data.role,
      permissions: data.permissions
    });

    return {
      id: agent.id,
      username: agent.username,
      role: agent.role,
      permissions: agent.permissions
    };
  } catch (error) {
    console.error('Error creating agent:', error);
    return null;
  }
}

export async function updateAgent(id: string, data: {
  username?: string;
  password?: string;
  role?: 'admin' | 'agent';
  permissions?: {
    dashboard: boolean;
    agents: boolean;
    contacts: boolean;
    analytics: boolean;
    settings: boolean;
  };
}): Promise<Agent | null> {
  try {
    const agent = await db.updateAgent(id, {
      username: data.username,
      password: data.password,
      role: data.role,
      permissions: data.permissions
    });

    if (!agent) return null;

    return {
      id: agent.id,
      username: agent.username,
      role: agent.role,
      permissions: agent.permissions
    };
  } catch (error) {
    console.error('Error updating agent:', error);
    return null;
  }
}

export async function deleteAgent(id: string): Promise<boolean> {
  try {
    return await db.deleteAgent(id);
  } catch (error) {
    console.error('Error deleting agent:', error);
    return false;
  }
}
