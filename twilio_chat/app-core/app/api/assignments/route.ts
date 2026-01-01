import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET() {
  try {
    console.log('🔍 Assignments API called');
    
    const dbPath = path.join(process.cwd(), 'database.sqlite');
    const db = new Database(dbPath);
    console.log('✅ Database connected');
    
    const conversations = db.prepare('SELECT id, status, agent_id FROM conversations').all();
    console.log('✅ Conversations loaded:', conversations.length);
    
    const assignments: Record<string, { id: string; name: string } | null> = {};
    const statuses: Record<string, "open" | "closed"> = {};
    
    for (const conv of conversations) {
      console.log('🔍 Processing conversation:', { id: conv.id, agent_id: conv.agent_id, status: conv.status });
      
      if (conv.agent_id) {
        try {
          const agent = db.prepare('SELECT id, username FROM agents WHERE id = ? AND is_active = 1').get(conv.agent_id);
          if (agent) {
            assignments[conv.id] = { id: agent.id, name: agent.username };
            console.log('✅ Agent found:', { id: agent.id, username: agent.username });
          } else {
            console.log('⚠️ Agent not found for ID:', conv.agent_id);
            assignments[conv.id] = null;
          }
        } catch (agentError) {
          console.error('❌ Error fetching agent:', conv.agent_id, agentError);
          assignments[conv.id] = null;
        }
      } else {
        assignments[conv.id] = null;
        console.log('ℹ️ No agent assigned to conversation:', conv.id);
      }
      
      statuses[conv.id] = conv.status === 'closed' ? 'closed' : 'open';
    }
    
    db.close();
    console.log('✅ Assignments processed:', { assignments, statuses });
    
    return NextResponse.json({
      success: true,
      assignments,
      statuses
    });
  } catch (error) {
    console.error('❌ Error loading assignments:', error);
    return NextResponse.json(
      { error: 'Failed to load assignments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
