import { NextRequest, NextResponse } from 'next/server';
import { getConfiguredNumbers } from '@/lib/multi-number-config';

export async function GET(req: NextRequest) {
  try {
    // Get numbers from configuration (environment variables)
    const numbers = getConfiguredNumbers();
    
    console.log('📋 Returning configured numbers:', numbers.length);
    
    return NextResponse.json({
      success: true,
      numbers: numbers,
      count: numbers.length
    });
  } catch (error) {
    console.error('Error fetching numbers:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      numbers: []
    }, { status: 500 });
  }
}
