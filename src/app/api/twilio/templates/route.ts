import { NextRequest, NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-service';

export async function GET(req: NextRequest) {
  try {
    const twilioClient = await getTwilioClient();
    
    // Fetch content templates from Twilio
    const templates = await twilioClient.content.v1.contents.list({
      limit: 50 // Adjust as needed
    });

    console.log('🔍 Found templates:', templates.length);

    // Map templates to our interface (simplified - no approval status fetching)
    const mappedTemplates = templates.map(template => {
      return {
        sid: template.sid,
        friendlyName: template.friendlyName || 'Unnamed Template',
        language: template.language || 'en',
        status: 'available', // Default status since we can't fetch approval status
        category: 'unknown',
        contentSid: template.sid,
        dateCreated: template.dateCreated,
        dateUpdated: template.dateUpdated,
        rawTemplate: template
      };
    });

    console.log('📋 Template summary:', {
      total: mappedTemplates.length,
      templates: mappedTemplates.map(t => ({ 
        name: t.friendlyName, 
        language: t.language
      }))
    });

    return NextResponse.json({
      success: true,
      templates: mappedTemplates,
      count: mappedTemplates.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching Twilio templates:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      templates: []
    }, { status: 500 });
  }
}
