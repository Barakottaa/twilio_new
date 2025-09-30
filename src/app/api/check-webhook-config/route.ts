import { NextRequest, NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-service';

export async function GET() {
  try {
    const client = await getTwilioClient();
    
    // Get the messaging service configuration
    const messagingServices = await client.messaging.v1.services.list();
    
    console.log('🔍 Found messaging services:', messagingServices.length);
    
    const webhookConfig = {
      messagingServices: messagingServices.map(service => ({
        sid: service.sid,
        friendlyName: service.friendlyName,
        inboundRequestUrl: service.inboundRequestUrl,
        inboundMethod: service.inboundMethod,
        statusCallback: service.statusCallback,
        statusCallbackMethod: service.statusCallbackMethod
      })),
      totalServices: messagingServices.length
    };
    
    // Also check if there are any specific webhook configurations
    const webhookUrl = process.env.NGROK_URL || process.env.WEBHOOK_URL;
    
    return NextResponse.json({
      success: true,
      webhookConfig,
      environmentWebhookUrl: webhookUrl,
      currentAppUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      message: 'Webhook configuration check completed'
    });
    
  } catch (error) {
    console.error('Error checking webhook config:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
