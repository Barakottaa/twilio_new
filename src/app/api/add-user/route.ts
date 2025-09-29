import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function POST(req: Request) {
  try {
    const { username, password, role, permissions } = await req.json();
    
    if (!username || !password || !role) {
      return NextResponse.json({
        success: false,
        error: 'Username, password, and role are required'
      }, { status: 400 });
    }

    const db = await getDatabase();
    await db.initialize();
    
    // Check if user already exists
    const existingUser = await db.findAgentByUsername(username);
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User already exists'
      }, { status: 409 });
    }

    // Create new user
    const newUser = await db.createAgent({
      username,
      password,
      role: role as 'admin' | 'agent',
      permissions_dashboard: permissions?.dashboard ? 1 : 0,
      permissions_agents: permissions?.agents ? 1 : 0,
      permissions_contacts: permissions?.contacts ? 1 : 0,
      permissions_analytics: permissions?.analytics ? 1 : 0,
      permissions_settings: permissions?.settings ? 1 : 0
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
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
      }
    });
  } catch (error) {
    console.error('Add user error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
