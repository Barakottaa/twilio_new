import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';

export async function GET() {
  try {
    console.log('🔍 Testing agents API...');
    const db = await getDatabase();
    const agents = await db.getAllAgents();
    console.log('🔍 Raw agents from database:', agents);
    
    return NextResponse.json({
      success: true,
      count: agents.length,
      agents: agents,
      message: `Found ${agents.length} agents in database`
    });
  } catch (error) {
    console.error('Error testing agents:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test agents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
