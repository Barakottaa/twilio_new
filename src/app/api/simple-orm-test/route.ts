import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  try {
    const prisma = new PrismaClient();
    
    // Test basic Prisma operations
    const agents = await prisma.agent.findMany({
      where: { is_active: 1 },
      select: {
        id: true,
        username: true,
        role: true,
        permissions_dashboard: true,
        permissions_agents: true,
        permissions_contacts: true,
        permissions_analytics: true,
        permissions_settings: true
      }
    });
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'Prisma ORM test successful',
      agentCount: agents.length,
      agents: agents.map(agent => ({
        id: agent.id,
        username: agent.username,
        role: agent.role,
        permissions: {
          dashboard: agent.permissions_dashboard === 1,
          agents: agent.permissions_agents === 1,
          contacts: agent.permissions_contacts === 1,
          analytics: agent.permissions_analytics === 1,
          settings: agent.permissions_settings === 1
        }
      }))
    });
  } catch (error) {
    console.error('Prisma test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
