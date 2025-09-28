import { NextRequest, NextResponse } from 'next/server';
import { authenticateAgent } from '@/lib/auth';

const SESSION_COOKIE_NAME = 'twiliochat_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const agent = await authenticateAgent(username, password);

    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create session data
    const sessionData = {
      agentId: agent.id,
      username: agent.username,
      role: agent.role,
      timestamp: Date.now()
    };

    // Create response with agent data
    const response = NextResponse.json({
      message: 'Login successful',
      agent: {
        id: agent.id,
        username: agent.username,
        role: agent.role,
        permissions: agent.permissions
      }
    });

    // Set session cookie
    response.cookies.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000 // Convert to seconds
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
