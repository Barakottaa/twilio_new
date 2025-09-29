import { NextRequest, NextResponse } from 'next/server';
import { authenticateAgent } from '@/lib/auth';

const SESSION_COOKIE_NAME = 'twiliochat_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(req: NextRequest) {
  try {
    // Check if request has body
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await req.text();
    if (!body || body.trim() === '') {
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400 }
      );
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Body received:', body);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { username, password } = parsedBody;

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
      path: '/',
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
