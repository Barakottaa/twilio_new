import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function POST() {
  try {
    const db = await getDatabase();
    await db.initialize();
    
    const results: any = {
      admin: null,
      agent1: null,
      supervisor: null,
      manager: null
    };

    // Test users data
    const testUsers = [
      {
        username: 'admin',
        password: 'admin',
        role: 'admin' as const,
        permissions: {
          dashboard: 1,
          agents: 1,
          contacts: 1,
          analytics: 1,
          settings: 1
        }
      },
      {
        username: 'agent1',
        password: 'password123',
        role: 'agent' as const,
        permissions: {
          dashboard: 1,
          agents: 0,
          contacts: 1,
          analytics: 0,
          settings: 0
        }
      },
      {
        username: 'supervisor',
        password: 'supervisor123',
        role: 'agent' as const,
        permissions: {
          dashboard: 1,
          agents: 1,
          contacts: 1,
          analytics: 1,
          settings: 0
        }
      },
      {
        username: 'manager',
        password: 'manager123',
        role: 'admin' as const,
        permissions: {
          dashboard: 1,
          agents: 1,
          contacts: 1,
          analytics: 1,
          settings: 1
        }
      }
    ];

    for (const userData of testUsers) {
      try {
        // Check if user exists
        const existingUser = await db.findAgentByUsername(userData.username);
        
        if (existingUser) {
          // Update existing user
          const updatedUser = await db.updateAgent(existingUser.id, {
            password: userData.password,
            role: userData.role,
            permissions_dashboard: userData.permissions.dashboard,
            permissions_agents: userData.permissions.agents,
            permissions_contacts: userData.permissions.contacts,
            permissions_analytics: userData.permissions.analytics,
            permissions_settings: userData.permissions.settings
          });
          
          results[userData.username] = {
            action: 'updated',
            id: updatedUser?.id,
            username: updatedUser?.username,
            role: updatedUser?.role,
            permissions: {
              dashboard: updatedUser?.permissions_dashboard === 1,
              agents: updatedUser?.permissions_agents === 1,
              contacts: updatedUser?.permissions_contacts === 1,
              analytics: updatedUser?.permissions_analytics === 1,
              settings: updatedUser?.permissions_settings === 1
            }
          };
        } else {
          // Create new user
          const newUser = await db.createAgent({
            username: userData.username,
            password: userData.password,
            role: userData.role,
            permissions_dashboard: userData.permissions.dashboard,
            permissions_agents: userData.permissions.agents,
            permissions_contacts: userData.permissions.contacts,
            permissions_analytics: userData.permissions.analytics,
            permissions_settings: userData.permissions.settings
          });
          
          results[userData.username] = {
            action: 'created',
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
            permissions: {
              dashboard: newUser.permissions_dashboard === 1,
              agents: newUser.permissions_agents === 1,
              contacts: newUser.permissions_contacts === 1,
              analytics: newUser.permissions_analytics === 1,
              settings: newUser.permissions_settings === 1
            }
          };
        }
      } catch (error) {
        results[userData.username] = {
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test users setup completed',
      results
    });
  } catch (error) {
    console.error('Setup test users error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
