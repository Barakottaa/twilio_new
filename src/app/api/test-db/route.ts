import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function GET() {
  try {
    console.log('🔍 Testing database connection...');
    const db = await getDatabase();
    console.log('🔍 Database instance created:', !!db);
    
    const agents = await db.getAllAgents();
    console.log('🔍 Agents fetched:', agents.length);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      agentCount: agents.length,
      agents: agents
    });
  } catch (error) {
    console.error('🔍 Database test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
