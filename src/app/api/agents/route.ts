import { NextRequest, NextResponse } from 'next/server';
import { getAllAgents, createAgent, getAgentStats } from '@/lib/agent-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stats = searchParams.get('stats') === 'true';
    
    if (stats) {
      const agentStats = await getAgentStats();
      return NextResponse.json(agentStats);
    }
    
    const agents = await getAllAgents();
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const agentData = await req.json();
    
    // Validate required fields
    if (!agentData.name || !agentData.email || !agentData.department) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, department' },
        { status: 400 }
      );
    }
    
    const newAgent = await createAgent({
      name: agentData.name,
      email: agentData.email,
      avatar: agentData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(agentData.name)}&background=3b82f6&color=ffffff&size=150`,
      status: agentData.status || 'offline',
      maxConcurrentChats: agentData.maxConcurrentChats || 5,
      skills: agentData.skills || [],
      department: agentData.department,
      lastActive: new Date().toISOString(),
    });
    
    return NextResponse.json(newAgent, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
