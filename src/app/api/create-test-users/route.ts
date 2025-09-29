import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function POST() {
  try {
    const db = await getDatabase();
    await db.initialize();
    
    // Create test users
    const testUsers = [
      {
        username: 'agent1',
        password: 'password123',
        role: 'agent' as const,
        permissions_dashboard: 1,
        permissions_agents: 0,
        permissions_contacts: 1,
        permissions_analytics: 0,
        permissions_settings: 0
      },
      {
        username: 'supervisor',
        password: 'supervisor123',
        role: 'agent' as const,
        permissions_dashboard: 1,
        permissions_agents: 1,
        permissions_contacts: 1,
        permissions_analytics: 1,
        permissions_settings: 0
      },
      {
        username: 'manager',
        password: 'manager123',
        role: 'admin' as const,
        permissions_dashboard: 1,
        permissions_agents: 1,
        permissions_contacts: 1,
        permissions_analytics: 1,
        permissions_settings: 1
      }
    ];

    const createdUsers = [];

    for (const userData of testUsers) {
      try {
        const agent = await db.createAgent(userData);
        createdUsers.push({
          id: agent.id,
          username: agent.username,
          role: agent.role,
          permissions: {
            dashboard: agent.permissions_dashboard === 1,
            agents: agent.permissions_agents === 1,
            contacts: agent.permissions_contacts === 1,
            analytics: agent.permissions_analytics === 1,
            settings: agent.permissions_settings === 1
          }
        });
      } catch (error) {
        console.log(`User ${userData.username} might already exist, skipping...`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test users created successfully',
      users: createdUsers
    });
  } catch (error) {
    console.error('Create test users error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
