import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    await db.initialize();
    const agents = await db.getAllAgents();
    return NextResponse.json({ 
      success: true, 
      agentCount: agents.length,
      agents: agents.map(agent => ({
        id: agent.id,
        username: agent.username,
        role: agent.role
      }))
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
