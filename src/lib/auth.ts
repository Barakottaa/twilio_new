'use server';

import { getDatabase } from './database-config';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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

const SESSION_COOKIE_NAME = 'twiliochat_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function authenticateAgent(username: string, password: string): Promise<Agent | null> {
  try {
    await ensureInitialized();
    const db = await getDatabase();
    const agentRecord = await db.authenticateAgent(username, password);
    if (!agentRecord) return null;

    // Convert database record to Agent type
    const agent: Agent = {
      id: agentRecord.id,
      username: agentRecord.username,
      role: agentRecord.role,
      permissions: agentRecord.permissions
    };

    return agent;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function createSession(agent: Agent): Promise<void> {
  const cookieStore = await cookies();
  const sessionData = {
    agentId: agent.id,
    username: agent.username,
    role: agent.role,
    timestamp: Date.now()
  };

  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000 // Convert to seconds
  });
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    await ensureInitialized();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie) return null;

    const sessionData = JSON.parse(sessionCookie.value);
    
    // Check if session is expired
    if (Date.now() - sessionData.timestamp > SESSION_DURATION) {
      return null;
    }

    // Get agent from database
    const db = await getDatabase();
    const agentRecord = await db.getAgent(sessionData.agentId);
    if (!agentRecord || !agentRecord.isActive) {
      return null;
    }

    // Convert to Agent type
    const agent: Agent = {
      id: agentRecord.id,
      username: agentRecord.username,
      role: agentRecord.role,
      permissions: agentRecord.permissions
    };

    return {
      agent,
      isAuthenticated: true
    };
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAuth(): Promise<Agent> {
  const session = await getSession();
  if (!session || !session.isAuthenticated) {
    redirect('/login');
  }
  return session.agent;
}

