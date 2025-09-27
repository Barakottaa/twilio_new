import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials are not set');
}

const client = twilio(accountSid, authToken);

export async function POST(req: NextRequest) {
  try {
    const { to, message } = await req.json();
    
    console.log('🧪 Testing WhatsApp message delivery:', { to, message });
    
    // Use Twilio Programmable Messaging API for WhatsApp delivery
    const twilioMessage = await client.messages.create({
      body: message,
      from: 'whatsapp:+14155238886', // Your Twilio WhatsApp sandbox number
      to: `whatsapp:${to}`,
    });
    
    console.log('✅ WhatsApp message sent successfully:', twilioMessage.sid);
    
    return NextResponse.json({
      success: true,
      messageSid: twilioMessage.sid,
      status: twilioMessage.status,
      to: twilioMessage.to,
      from: twilioMessage.from,
    });
  } catch (error: any) {
    console.error('❌ Error sending WhatsApp message:', {
      error: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
    });
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      status: error.status,
    }, { status: 500 });
  }
}
