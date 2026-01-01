'use server';

import { getDatabase } from './database-config';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSessionFrom } from './session';
import type { Agent } from '@/types';

// Initialize database on first import
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    const db = await getDatabase();
    await db.initialize();
    isInitialized = true;
  }
}

export interface AuthSession {
  agent: Agent;
  isAuthenticated: boolean;
}

export async function authenticateAgent(username: string, password: string): Promise<Agent | null> {
  try {
    await ensureInitialized();
    const db = await getDatabase();
    const agentRecord = await db.authenticateAgent(username, password);
    if (!agentRecord) return null;

    // Convert database record to Agent type
    // Handle both individual fields and permissions object
    let permissions;
    if (agentRecord.permissions && typeof agentRecord.permissions === 'object') {
      // If permissions is an object, use it directly
      permissions = agentRecord.permissions;
    } else {
      // If individual fields exist, convert them
      permissions = {
        dashboard: (agentRecord as any).permissions_dashboard === 1,
        agents: (agentRecord as any).permissions_agents === 1,
        contacts: (agentRecord as any).permissions_contacts === 1,
        analytics: (agentRecord as any).permissions_analytics === 1,
        settings: (agentRecord as any).permissions_settings === 1
      };
    }

    const agent: Agent = {
      id: agentRecord.id,
      username: agentRecord.username,
      role: agentRecord.role,
      permissions: permissions
    };

    return agent;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const token = (await cookies()).get('twiliochat_session')?.value;
    if (!token) return null;
    
    const session = await readSessionFrom(token);
    return session;
  } catch (error) {
    console.error('Session error:', error);
    return null; // expired/invalid -> treated as logged out
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('twiliochat_session');
}

export async function requireAuth(): Promise<Agent> {
  const session = await getSession();
  if (!session || !session.isAuthenticated) {
    redirect('/login');
  }
  return session.agent;
}

