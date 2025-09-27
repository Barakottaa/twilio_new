import { NextRequest, NextResponse } from 'next/server';
import { addContact } from '@/lib/contact-mapping';
import twilio from 'twilio';

// WhatsApp Status Callback endpoint
export async function POST(req: NextRequest) {
  try {
    console.log('📱 WhatsApp Status Callback received');
    
    // Get the webhook URL for validation
    const webhookUrl = new URL(req.url);
    const fullUrl = `${webhookUrl.protocol}//${webhookUrl.host}${webhookUrl.pathname}`;
    
    // Get the signature from headers
    const signature = req.headers.get('x-twilio-signature');
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!signature || !authToken) {
      console.error('Missing signature or auth token for webhook validation');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the raw body for signature validation
    const body = await req.text();
    
    // Validate the webhook signature
    const isValid = twilio.validateRequest(authToken, signature, fullUrl, body as string);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }
    
    // Parse the validated form data
    const formData = new URLSearchParams(body);
    const params: { [key: string]: string } = {};
    formData.forEach((value, key) => {
      params[key] = value;
    });

    console.log('📱 WhatsApp Status Callback parameters:', Object.keys(params).map(key => `${key}: ${params[key]}`).join(', '));
    
    // Extract WhatsApp contact information
    const profileName = params.ProfileName;
    const waId = params.WaId;
    const from = params.From;
    const messageBody = params.Body;
    
    if (profileName && waId && from) {
      console.log('👤 WhatsApp contact info found:', { profileName, waId, from, messageBody });
      
      // Format phone number (remove whatsapp: prefix if present)
      const phoneNumber = from.replace('whatsapp:', '');
      
      // Generate avatar using UI Avatars service
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=random`;
      
      // Store contact in our mapping system
      addContact(phoneNumber, profileName, avatar);
      
      console.log('✅ WhatsApp contact stored:', { phoneNumber, profileName, avatar });
    } else {
      console.log('⚠️ No WhatsApp contact info found in status callback');
    }
    
    return NextResponse.json({ 
      message: 'WhatsApp status callback processed successfully',
      contactProcessed: !!(profileName && waId)
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error processing WhatsApp status callback:', error);
    return NextResponse.json({ 
      message: 'WhatsApp status callback processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
