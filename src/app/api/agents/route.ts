import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function GET() {
  try {
    const db = await getDatabase();
    const agents = await db.getAllAgents();
    
    // Return only active agents with safe data (no passwords)
    const safeAgents = agents
      .filter(agent => agent.isActive)
      .map(agent => ({
        id: agent.id,
        username: agent.username,
        role: agent.role,
        permissions: agent.permissions
      }));
    
    return NextResponse.json({
      success: true,
      agents: safeAgents
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}