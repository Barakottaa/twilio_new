import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mediaSid: string }> }
) {
  console.log('🎯 MEDIA ROUTE HIT! URL:', req.url);
  try {
    const { mediaSid } = await params;
    const chatServiceSid = req.nextUrl.searchParams.get('chatServiceSid');

    console.log('🔍 Fetching media:', { mediaSid, chatServiceSid });

    // Build Basic Auth header for MCS API
    const authHeader = 'Basic ' + Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString('base64');

    // Step 1: Fetch media metadata from MCS
    // Try both with ServiceSid and without (default service)
    const mcsBase = 'https://mcs.us1.twilio.com/v1';
    const candidates = chatServiceSid
      ? [
          `${mcsBase}/Services/${chatServiceSid}/Media/${mediaSid}`,
          `${mcsBase}/Media/${mediaSid}` // fallback to default service
        ]
      : [`${mcsBase}/Media/${mediaSid}`];

    let temporaryUrl: string | undefined;
    let contentType = 'application/octet-stream';

    for (const metadataUrl of candidates) {
      console.log('📞 Trying MCS metadata URL:', metadataUrl);
      try {
        const metadataResponse = await fetch(metadataUrl, {
          headers: { Authorization: authHeader }
        });

        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          console.log('✅ Got media metadata:', metadata);
          
          // Extract temporary download URL from metadata
          temporaryUrl = metadata.links?.content_direct_temporary || metadata.links?.content_direct;
          contentType = metadata.content_type || contentType;
          
          if (temporaryUrl) {
            console.log('✅ Found temporary URL:', temporaryUrl);
            break;
          }
        } else {
          console.log(`⚠️  MCS returned ${metadataResponse.status} for ${metadataUrl}`);
        }
      } catch (err) {
        console.log('⚠️  Failed to fetch from:', metadataUrl, err);
      }
    }

    if (!temporaryUrl) {
      console.error('❌ Could not retrieve media temporary URL from MCS');
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Step 2: Download the actual media content using the temporary URL
    console.log('🔗 Downloading media from temporary URL...');
    const mediaResponse = await fetch(temporaryUrl);

    if (!mediaResponse.ok) {
      console.error('❌ Failed to download media:', mediaResponse.status);
      return NextResponse.json({ error: 'Failed to download media' }, { status: mediaResponse.status });
    }

    const buffer = await mediaResponse.arrayBuffer();
    const finalContentType = contentType || mediaResponse.headers.get('content-type') || 'application/octet-stream';

    console.log('✅ Media downloaded successfully:', { size: buffer.byteLength, contentType: finalContentType });

    // Return the media with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': finalContentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('❌ Error proxying media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

