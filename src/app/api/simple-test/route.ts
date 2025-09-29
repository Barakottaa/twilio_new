import { NextResponse } from 'next/server';

export async function GET() {
  const start = Date.now();
  
  // Simple response without any database operations
  const result = {
    message: 'Simple test response',
    timestamp: new Date().toISOString(),
    processingTime: Date.now() - start
  };
  
  return NextResponse.json(result);
}
