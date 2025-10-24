import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

// Helper function to log to file
function logToFile(message: string) {
  try {
    const logDir = path.join(process.cwd(), '..', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'webhook-debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// 🟢 Twilio Webhook endpoint (simplified - no Bird processing)
export async function POST(req: NextRequest) {
  try {
    logToFile('=== NEW TWILIO WEBHOOK REQUEST ===');
    const body = await req.json();
    logToFile(`Incoming Body: ${JSON.stringify(body, null, 2)}`);
    console.log('📩 Incoming Twilio event:', JSON.stringify(body, null, 2));

    // This is now a simple Twilio webhook - no Bird processing
    // Bird processing is handled by the separate Bird webhook service
    
    logToFile('=== TWILIO WEBHOOK REQUEST COMPLETED ===\n');
    return NextResponse.json({ 
      success: true, 
      message: 'Twilio webhook received - Bird processing handled by separate service' 
    });
  } catch (err: any) {
    console.error('❌ Twilio webhook error:', err.message);
    console.error('❌ Error stack:', err.stack);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
