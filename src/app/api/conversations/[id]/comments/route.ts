import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// GET - Fetch comments for a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    
    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const dbPath = path.join(process.cwd(), 'database.sqlite');
    const db = new Database(dbPath);
    
    const comments = db.prepare(`
      SELECT c.*, a.username as agent_name 
      FROM comments c 
      LEFT JOIN agents a ON c.agent_id = a.id 
      WHERE c.conversation_id = ? 
      ORDER BY c.created_at DESC
    `).all(conversationId);
    
    db.close();
    
    return NextResponse.json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Create a new comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { content, agentId } = await req.json();
    
    if (!conversationId || !content || !agentId) {
      return NextResponse.json(
        { error: 'Conversation ID, content, and agent ID are required' },
        { status: 400 }
      );
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const dbPath = path.join(process.cwd(), 'database.sqlite');
    const db = new Database(dbPath);
    
    const result = db.prepare(`
      INSERT INTO comments (id, conversation_id, agent_id, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(commentId, conversationId, agentId, content);
    
    // Fetch the created comment with agent name
    const comment = db.prepare(`
      SELECT c.*, a.username as agent_name 
      FROM comments c 
      LEFT JOIN agents a ON c.agent_id = a.id 
      WHERE c.id = ?
    `).get(commentId);
    
    db.close();
    
    return NextResponse.json({
      success: true,
      comment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
