import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function GET() {
  try {
    const db = await getDatabase();
    await db.initialize();
    
    const results: any = {
      databaseInitialized: true,
      operations: {}
    };

    // Test 1: Get all agents
    try {
      const allAgents = await db.getAllAgents();
      results.operations.getAllAgents = {
        success: true,
        count: allAgents.length,
        agents: allAgents.map(agent => ({
          id: agent.id,
          username: agent.username,
          role: agent.role
        }))
      };
    } catch (error) {
      results.operations.getAllAgents = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 2: Find specific users
    const testUsernames = ['admin', 'agent1', 'supervisor', 'manager'];
    for (const username of testUsernames) {
      try {
        const user = await db.findAgentByUsername(username);
        results.operations[`findUser_${username}`] = {
          success: true,
          found: !!user,
          user: user ? {
            id: user.id,
            username: user.username,
            role: user.role
          } : null
        };
      } catch (error) {
        results.operations[`findUser_${username}`] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Test 3: Try to create a test user
    try {
      const testUser = await db.createAgent({
        username: 'testuser',
        password: 'testpass',
        role: 'agent',
        permissions_dashboard: 1,
        permissions_agents: 0,
        permissions_contacts: 1,
        permissions_analytics: 0,
        permissions_settings: 0
      });
      results.operations.createTestUser = {
        success: true,
        user: {
          id: testUser.id,
          username: testUser.username,
          role: testUser.role
        }
      };
    } catch (error) {
      results.operations.createTestUser = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Test DB operations error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
