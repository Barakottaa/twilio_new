import { NextRequest, NextResponse } from 'next/server';
import { listMessages } from '@/lib/twilio-service';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId');
    
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }
    
    const limit = Number(url.searchParams.get('limit') ?? 25);
    const before = url.searchParams.get('before') ?? undefined;

    // Fetching messages for conversation

    const data = await listMessages(conversationId, limit, before);
    
    const response = NextResponse.json({
      success: true,
      ...data,
      timestamp: new Date().toISOString()
    });

    // Cache messages for a short time
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      messages: [],
      nextBefore: undefined
    }, { status: 500 });
  }
}