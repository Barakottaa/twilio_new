import { NextResponse } from 'next/server';
import { sqliteDb } from '@/lib/sqlite-database';

// Pre-initialize the database connection
let dbInitialized = false;
const initDb = async () => {
  if (!dbInitialized) {
    await sqliteDb.ensureInitialized();
    dbInitialized = true;
  }
};

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    
    // Initialize database once
    await initDb();
    
    // Fast authentication
    const agent = await sqliteDb.authenticateAgent(username, password);
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        username: agent.username,
        name: agent.username,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.username)}&background=10b981&color=ffffff&size=150`,
        role: agent.role,
        permissions: agent.permissions
      }
    });
  } catch (error) {
    console.error('Fast auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
