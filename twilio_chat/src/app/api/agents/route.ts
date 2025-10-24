import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function GET() {
  try {
    const db = await getDatabase();
    const agents = await db.getAllAgents();
    
    // Transform agents to include permissions object
    const transformedAgents = agents.map(agent => ({
      ...agent,
      permissions: {
        dashboard: agent.permissions_dashboard === 1,
        agents: agent.permissions_agents === 1,
        contacts: agent.permissions_contacts === 1,
        analytics: agent.permissions_analytics === 1,
        settings: agent.permissions_settings === 1
      }
    }));
    
    return NextResponse.json({ success: true, agents: transformedAgents });
  } catch (error: any) {
    console.error('❌ Error fetching agents:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, permissions = {} } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'username and password are required' }, { status: 400 });
    }

    const db = await getDatabase();
    
    // Check if username already exists
    const existingAgents = await db.getAllAgents();
    const usernameExists = existingAgents.some(agent => agent.username === username);
    
    if (usernameExists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Username already exists. Please choose a different username.' 
      }, { status: 409 });
    }

    const newAgent = await db.createAgent({
      username,
      password,
      role: 'agent', // Default all new agents to 'agent' role
      permissions_dashboard: permissions.dashboard ? 1 : 0,
      permissions_agents: permissions.agents ? 1 : 0,
      permissions_contacts: permissions.contacts ? 1 : 0,
      permissions_analytics: permissions.analytics ? 1 : 0,
      permissions_settings: permissions.settings ? 1 : 0,
      is_active: 1
    });

    return NextResponse.json({ success: true, agent: newAgent });
  } catch (error: any) {
    console.error('❌ Error creating agent:', error);
    
    // Handle specific database constraint errors
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ 
        success: false, 
        error: 'Username already exists. Please choose a different username.' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}