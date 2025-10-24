import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Simple fallback numbers for now
    const numbers = [
      {
        id: '1',
        number: '+1234567890',
        name: 'Support Number',
        department: 'Customer Service',
        isActive: true
      },
      {
        id: '2', 
        number: '+0987654321',
        name: 'Sales Number',
        department: 'Sales Team',
        isActive: true
      }
    ];
    
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
