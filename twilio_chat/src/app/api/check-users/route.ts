import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function GET() {
  try {
    const db = await getDatabase();
    await db.initialize();
    
    // Get all agents from database
    const agents = await db.getAllAgents();
    
    return NextResponse.json({
      success: true,
      count: agents.length,
      agents: agents.map(agent => ({
        id: agent.id,
        username: agent.username,
        role: agent.role,
        permissions: {
          dashboard: agent.permissions_dashboard === 1,
          agents: agent.permissions_agents === 1,
          contacts: agent.permissions_contacts === 1,
          analytics: agent.permissions_analytics === 1,
          settings: agent.permissions_settings === 1
        },
        isActive: agent.is_active === 1,
        createdAt: agent.created_at,
        updatedAt: agent.updated_at
      }))
    });
  } catch (error) {
    console.error('Check users error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
