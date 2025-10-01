import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function GET() {
  try {
    const db = await getDatabase();
    const conversations = await db.getAllConversations();
    
    const assignments: Record<string, { id: string; name: string } | null> = {};
    const statuses: Record<string, "open" | "closed"> = {};
    
    for (const conv of conversations) {
      if (conv.agent_id) {
        const agent = await db.getAgent(conv.agent_id);
        if (agent) {
          assignments[conv.id] = { id: agent.id, name: agent.username };
        }
      } else {
        assignments[conv.id] = null;
      }
      
      statuses[conv.id] = conv.status === 'closed' ? 'closed' : 'open';
    }
    
    return NextResponse.json({
      success: true,
      assignments,
      statuses
    });
  } catch (error) {
    console.error('Error loading assignments:', error);
    return NextResponse.json(
      { error: 'Failed to load assignments' },
      { status: 500 }
    );
  }
}
