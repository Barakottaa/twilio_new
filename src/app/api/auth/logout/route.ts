import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'twiliochat_session';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Logout successful' });
    
    // Clear session cookie
    response.cookies.delete(SESSION_COOKIE_NAME);
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
