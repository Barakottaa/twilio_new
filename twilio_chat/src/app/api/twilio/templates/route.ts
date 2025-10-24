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

    // Define business-initiated templates based on your Twilio console
    // Only 'welcome_template' has the green checkmark for WhatsApp business initiated
    const businessInitiatedTemplateNames = [
      'welcome_template'
    ];

    // Map templates to our interface
    const mappedTemplates = templates.map(template => {
      const templateName = template.friendlyName || '';
      const whatsappBusinessInitiated = businessInitiatedTemplateNames.includes(templateName);

      return {
        sid: template.sid,
        friendlyName: templateName,
        language: template.language || 'en',
        status: 'available',
        category: 'unknown',
        contentSid: template.sid,
        dateCreated: template.dateCreated,
        dateUpdated: template.dateUpdated,
        whatsappBusinessInitiated,
        rawTemplate: template
      };
    });

    // Filter for only business-initiated templates
    const businessInitiatedTemplates = mappedTemplates.filter(template => template.whatsappBusinessInitiated);

    console.log('📋 Template summary:', {
      total: mappedTemplates.length,
      businessInitiated: businessInitiatedTemplates.length,
      templates: businessInitiatedTemplates.map(t => ({ 
        name: t.friendlyName, 
        language: t.language,
        businessInitiated: t.whatsappBusinessInitiated
      }))
    });

    return NextResponse.json({
      success: true,
      templates: businessInitiatedTemplates, // Only return business-initiated templates
      count: businessInitiatedTemplates.length,
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
