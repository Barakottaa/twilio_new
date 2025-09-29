import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function POST() {
  try {
    const db = await getDatabase();
    await db.initialize();
    
    // Get all agents
    const agents = await db.getAllAgents();
    const adminAgent = agents.find(agent => agent.username === 'admin');
    
    if (!adminAgent) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found'
      }, { status: 404 });
    }

    // Update admin permissions to have all permissions
    const updatedAgent = await db.updateAgent(adminAgent.id, {
      permissions_dashboard: 1,
      permissions_agents: 1,
      permissions_contacts: 1,
      permissions_analytics: 1,
      permissions_settings: 1
    });

    if (!updatedAgent) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update admin permissions'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin permissions updated successfully',
      agent: {
        id: updatedAgent.id,
        username: updatedAgent.username,
        role: updatedAgent.role,
        permissions: {
          dashboard: updatedAgent.permissions_dashboard === 1,
          agents: updatedAgent.permissions_agents === 1,
          contacts: updatedAgent.permissions_contacts === 1,
          analytics: updatedAgent.permissions_analytics === 1,
          settings: updatedAgent.permissions_settings === 1
        }
      }
    });
  } catch (error) {
    console.error('Fix admin permissions error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
