import { NextRequest, NextResponse } from 'next/server';
import { updateAgentStatus } from '@/lib/agent-service';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { status } = await req.json();
    
    if (!status || !['online', 'offline', 'busy', 'away'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: online, offline, busy, away' },
        { status: 400 }
      );
    }
    
    const updatedAgent = await updateAgentStatus(resolvedParams.id, status);
    
    if (!updatedAgent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error('Error updating agent status:', error);
    return NextResponse.json({ error: 'Failed to update agent status' }, { status: 500 });
  }
}
