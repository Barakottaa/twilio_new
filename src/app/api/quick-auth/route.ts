import { NextResponse } from 'next/server';

// Simple in-memory authentication for development
const users = {
  'agent1': { password: 'password123', role: 'agent', permissions: { dashboard: true, contacts: true } },
  'supervisor': { password: 'supervisor123', role: 'agent', permissions: { dashboard: true, agents: true, contacts: true, analytics: true } },
  'manager': { password: 'manager123', role: 'admin', permissions: { dashboard: true, agents: true, contacts: true, analytics: true, settings: true } },
  'admin': { password: 'admin', role: 'admin', permissions: { dashboard: true, agents: true, contacts: true, analytics: true, settings: true } }
};

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    
    const user = users[username as keyof typeof users];
    
    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: `user_${username}`,
        username,
        name: username,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=10b981&color=ffffff&size=150`,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
