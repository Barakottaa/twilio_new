import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { mediaSid: string } }
) {
  try {
    const mediaSid = params.mediaSid;
    const conversationSid = req.nextUrl.searchParams.get('conversationSid');

    if (!conversationSid) {
      return NextResponse.json({ error: 'Missing conversationSid' }, { status: 400 });
    }

    // Fetch media from Twilio with authentication
    const mediaUrl = `https://mcs.us1.twilio.com/v1/Services/${conversationSid}/Media/${mediaSid}`;
    
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64')}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch media from Twilio:', response.status);
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: response.status });
    }

    // Get the media content
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Return the media with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error proxying media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

