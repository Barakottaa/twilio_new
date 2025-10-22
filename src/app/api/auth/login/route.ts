import { NextRequest, NextResponse } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { issueSessionCookie } from '@/lib/session';

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

    // Create JWT session cookie
    const cookie = await issueSessionCookie({
      id: agent.id,
      username: agent.username,
      role: agent.role,
      permissions: agent.permissions
    });

    // Return JSON response with cookie set (client will handle navigation)
    const res = NextResponse.json({ 
      success: true, 
      agent: {
        id: agent.id,
        username: agent.username,
        name: agent.username,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.username)}&background=10b981&color=ffffff&size=150`,
        role: agent.role,
        permissions: agent.permissions
      }
    }, { status: 200 });
    
    res.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      secure: false,       // localhost (set true in prod/HTTPS)
      sameSite: 'lax',     // localhost same-origin
      path: '/',
      maxAge: cookie.maxAge,
    });
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
