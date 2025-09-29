import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function POST() {
  try {
    const db = await getDatabase();
    await db.initialize();
    
    console.log('🔧 Starting database fix...');
    
    // Step 1: Clear all existing agents
    console.log('🗑️ Clearing existing agents...');
    const existingAgents = await db.getAllAgents();
    for (const agent of existingAgents) {
      await db.deleteAgent(agent.id);
      console.log(`✅ Deleted agent: ${agent.username}`);
    }
    
    // Step 2: Create all users one by one with error handling
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

    const results = [];
    
    for (const userData of users) {
      try {
        console.log(`👤 Creating user: ${userData.username}...`);
        
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
        
        // Verify the user was created
        const verifyUser = await db.findAgentByUsername(userData.username);
        if (verifyUser) {
          console.log(`✅ User created and verified: ${userData.username}`);
          results.push({
            username: userData.username,
            status: 'SUCCESS',
            id: agent.id,
            verified: true
          });
        } else {
          console.log(`❌ User created but not found: ${userData.username}`);
          results.push({
            username: userData.username,
            status: 'CREATED_BUT_NOT_FOUND',
            id: agent.id,
            verified: false
          });
        }
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.username}:`, error);
        results.push({
          username: userData.username,
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Step 3: Final verification
    console.log('🔍 Final verification...');
    const finalAgents = await db.getAllAgents();
    const finalResults = [];
    
    for (const username of ['admin', 'agent1', 'supervisor', 'manager']) {
      const user = await db.findAgentByUsername(username);
      finalResults.push({
        username,
        found: !!user,
        id: user?.id || null
      });
    }

    console.log('✅ Database fix completed');
    
    return NextResponse.json({
      success: true,
      message: 'Database fix completed',
      creationResults: results,
      finalVerification: finalResults,
      totalAgentsInDB: finalAgents.length,
      allAgents: finalAgents.map(agent => ({
        id: agent.id,
        username: agent.username,
        role: agent.role
      }))
    });
  } catch (error) {
    console.error('Database fix error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
