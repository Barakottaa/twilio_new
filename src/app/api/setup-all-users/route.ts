import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function POST() {
  try {
    const db = await getDatabase();
    await db.initialize();
    
    // Clear existing users first
    const existingAgents = await db.getAllAgents();
    for (const agent of existingAgents) {
      await db.deleteAgent(agent.id);
    }
    
    // Define all users
    const users = [
      {
        username: 'admin',
        password: 'admin',
        role: 'admin' as const,
        permissions: {
          dashboard: true,
          agents: true,
          contacts: true,
          analytics: true,
          settings: true
        }
      },
      {
        username: 'agent1',
        password: 'password123',
        role: 'agent' as const,
        permissions: {
          dashboard: true,
          agents: false,
          contacts: true,
          analytics: false,
          settings: false
        }
      },
      {
        username: 'supervisor',
        password: 'supervisor123',
        role: 'agent' as const,
        permissions: {
          dashboard: true,
          agents: true,
          contacts: true,
          analytics: true,
          settings: false
        }
      },
      {
        username: 'manager',
        password: 'manager123',
        role: 'admin' as const,
        permissions: {
          dashboard: true,
          agents: true,
          contacts: true,
          analytics: true,
          settings: true
        }
      }
    ];

    const createdUsers = [];
    
    for (const userData of users) {
      try {
        const agent = await db.createAgent({
          username: userData.username,
          password: userData.password,
          role: userData.role,
          permissions_dashboard: userData.permissions.dashboard ? 1 : 0,
          permissions_agents: userData.permissions.agents ? 1 : 0,
          permissions_contacts: userData.permissions.contacts ? 1 : 0,
          permissions_analytics: userData.permissions.analytics ? 1 : 0,
          permissions_settings: userData.permissions.settings ? 1 : 0
        });
        
        createdUsers.push({
          id: agent.id,
          username: agent.username,
          role: agent.role,
          permissions: userData.permissions
        });
        
        console.log(`✅ Created user: ${agent.username}`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.username}:`, error);
        createdUsers.push({
          username: userData.username,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Verify all users were created
    const allAgents = await db.getAllAgents();
    
    return NextResponse.json({
      success: true,
      message: 'All users setup completed',
      createdUsers,
      totalUsersInDB: allAgents.length,
      allUsers: allAgents.map(agent => ({
        id: agent.id,
        username: agent.username,
        role: agent.role
      }))
    });
  } catch (error) {
    console.error('Setup all users error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
