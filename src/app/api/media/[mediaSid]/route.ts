import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mediaSid: string }> }
) {
  try {
    const { mediaSid } = await params;
    const conversationSid = req.nextUrl.searchParams.get('conversationSid');
    const chatServiceSid = req.nextUrl.searchParams.get('chatServiceSid');
    const messageSid = req.nextUrl.searchParams.get('messageSid');

    if (!conversationSid) {
      return NextResponse.json({ error: 'Missing conversationSid' }, { status: 400 });
    }

    console.log('🔍 Fetching media:', { conversationSid, chatServiceSid, messageSid, mediaSid });

    // Use Twilio SDK to fetch media
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    try {
      // Fetch media using Twilio SDK with full service hierarchy
      // Must use services(chatServiceSid) to properly scope the request
      const mediaInstance = await client.conversations.v1
        .services(chatServiceSid)
        .conversations(conversationSid)
        .messages(messageSid)
        .media(mediaSid)
        .fetch();

      console.log('✅ Media fetched from Twilio:', {
        sid: mediaInstance.sid,
        contentType: mediaInstance.contentType,
        size: mediaInstance.size
      });

      // Get the actual media content URL - try temporary first, fallback to direct
      const mediaContentUrl = 
        mediaInstance.links.content_direct_temporary ?? 
        mediaInstance.links.content_direct;
      
      if (!mediaContentUrl) {
        console.error('❌ No content URL available for media');
        return NextResponse.json({ error: 'Media content not available' }, { status: 404 });
      }

      console.log('🔗 Using media content URL:', mediaContentUrl);

      // Fetch the actual media content
      const response = await fetch(mediaContentUrl);

      if (!response.ok) {
        console.error('Failed to fetch media content:', response.status);
        return NextResponse.json({ error: 'Failed to fetch media content' }, { status: response.status });
      }

      // Get the media content
      const buffer = await response.arrayBuffer();
      const contentType = mediaInstance.contentType || response.headers.get('content-type') || 'application/octet-stream';

      // Return the media with appropriate headers
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (twilioError) {
      console.error('❌ Twilio SDK error:', twilioError);
      return NextResponse.json({ error: 'Failed to fetch from Twilio' }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Error proxying media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

