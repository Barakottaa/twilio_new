import { NextRequest, NextResponse } from 'next/server';
import { readSessionFrom } from '@/lib/session';

const SESSION_COOKIE_NAME = 'twiliochat_session';

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

    // Verify JWT token
    const session = await readSessionFrom(sessionCookie.value);
    
    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: session.agent.id,
      username: session.agent.username,
      name: session.agent.username, // Use username as name for now
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.agent.username)}&background=10b981&color=ffffff&size=150`,
      role: session.agent.role,
      permissions: session.agent.permissions
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
