import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

const SESSION_COOKIE_NAME = 'twiliochat_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(req: NextRequest) {
  try {
    // Get session cookie directly from request
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(sessionCookie.value);
    
    // Check if session is expired
    if (Date.now() - sessionData.timestamp > SESSION_DURATION) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Get agent from database
    const db = await getDatabase();
    const agentRecord = await db.getAgent(sessionData.agentId);
    
    if (!agentRecord || !agentRecord.isActive) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: agentRecord.id,
      username: agentRecord.username,
      name: agentRecord.username, // Use username as name for now
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(agentRecord.username)}&background=10b981&color=ffffff&size=150`,
      role: agentRecord.role,
      permissions: agentRecord.permissions
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
