import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-config';
import { prismaDb } from '@/lib/prisma-database';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    comparison: {}
  };

  try {
    // Test 1: Raw SQL approach (current)
    console.log('🔍 Testing Raw SQL approach...');
    const startRaw = Date.now();
    
    const rawDb = await getDatabase();
    await rawDb.initialize();
    const rawAgents = await rawDb.getAllAgents();
    
    const rawTime = Date.now() - startRaw;
    
    results.comparison.rawSql = {
      approach: 'Raw SQL + SQLite',
      timeMs: rawTime,
      agentCount: rawAgents.length,
      agents: rawAgents.map(agent => ({
        id: agent.id,
        username: agent.username,
        role: agent.role
      }))
    };

    // Test 2: Prisma ORM approach
    console.log('🔍 Testing Prisma ORM approach...');
    const startPrisma = Date.now();
    
    await prismaDb.initialize();
    const prismaAgents = await prismaDb.getAllAgents();
    
    const prismaTime = Date.now() - startPrisma;
    
    results.comparison.prisma = {
      approach: 'Prisma ORM + SQLite',
      timeMs: prismaTime,
      agentCount: prismaAgents.length,
      agents: prismaAgents.map(agent => ({
        id: agent.id,
        username: agent.username,
        role: agent.role
      }))
    };

    // Test 3: Create a test user with both approaches
    console.log('🔍 Testing user creation...');
    
    // Raw SQL
    const rawStart = Date.now();
    const rawUser = await rawDb.createAgent({
      username: 'test_raw_user',
      password: 'test_password',
      role: 'agent',
      permissions_dashboard: 1,
      permissions_agents: 0,
      permissions_contacts: 1,
      permissions_analytics: 0,
      permissions_settings: 0
    });
    const rawCreateTime = Date.now() - rawStart;
    
    // Prisma
    const prismaStart = Date.now();
    const prismaUser = await prismaDb.createAgent({
      username: 'test_prisma_user',
      password: 'test_password',
      role: 'agent',
      permissions_dashboard: 1,
      permissions_agents: 0,
      permissions_contacts: 1,
      permissions_analytics: 0,
      permissions_settings: 0
    });
    const prismaCreateTime = Date.now() - prismaStart;
    
    // Clean up test users
    await rawDb.deleteAgent(rawUser.id);
    await prismaDb.deleteAgent(prismaUser.id);
    
    results.comparison.userCreation = {
      rawSql: {
        timeMs: rawCreateTime,
        success: !!rawUser
      },
      prisma: {
        timeMs: prismaCreateTime,
        success: !!prismaUser
      }
    };

    // Summary
    results.summary = {
      rawSqlTotalTime: rawTime + rawCreateTime,
      prismaTotalTime: prismaTime + prismaCreateTime,
      performanceDifference: `${((prismaTime + prismaCreateTime) - (rawTime + rawCreateTime)).toFixed(2)}ms`,
      recommendation: (prismaTime + prismaCreateTime) < (rawTime + rawCreateTime) + 50 
        ? 'Prisma is fast enough for your use case' 
        : 'Raw SQL is faster, but Prisma offers better developer experience'
    };

  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return NextResponse.json({
    success: true,
    results
  });
}
