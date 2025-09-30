import { NextRequest, NextResponse } from 'next/server';
import { processMediaMessage, calculateMediaStorageUsage } from '@/lib/media-handler';
import { broadcastMessage } from '@/lib/sse-broadcast';
import { invalidateConversationCache } from '@/lib/twilio-service';
import twilio from 'twilio';

// Enhanced webhook handler for media messages
export async function POST(req: NextRequest) {
  console.log('📱 MEDIA WEBHOOK CALLED - Processing media message');
  
  try {
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
    const isValid = twilio.validateRequest(authToken, signature, fullUrl, body as any);
    
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

    const eventType = params.EventType;
    const numMedia = parseInt(params.NumMedia || '0', 10);
    
    console.log('✅ Verified Twilio media webhook received:', { 
      eventType, 
      numMedia,
      conversationSid: params.ConversationSid,
      messageSid: params.MessageSid
    });
    
    // Handle media messages
    if ((eventType === 'onMessageAdded' || eventType === 'onMessageReceived') && numMedia > 0) {
      console.log('📸 Processing media message:', {
        numMedia,
        conversationSid: params.ConversationSid,
        messageSid: params.MessageSid,
        author: params.Author
      });
      
      // Process media files
      const mediaMessages = processMediaMessage(params);
      
      if (mediaMessages.length > 0) {
        console.log('📁 Media files detected:', mediaMessages.map(m => ({
          type: m.mediaType,
          url: m.mediaUrl,
          contentType: m.mediaContentType,
          fileName: m.fileName
        })));
        
        // Calculate storage usage
        const storageUsage = calculateMediaStorageUsage(mediaMessages);
        console.log('💾 Media storage usage:', {
          totalFiles: storageUsage.totalFiles,
          estimatedSize: `${(storageUsage.estimatedSize / 1024 / 1024).toFixed(2)}MB`,
          byType: storageUsage.byType
        });
        
        // Store media message references in database
        // Note: We're not storing the actual media files, just references
        // The media files remain on Twilio's servers with temporary URLs
        
        // Invalidate cache for this conversation
        await invalidateConversationCache(params.ConversationSid);
        
        // Broadcast the media message to all connected clients
        broadcastMessage('newMediaMessage', {
          conversationSid: params.ConversationSid,
          messageSid: params.MessageSid,
          mediaMessages: mediaMessages.map(media => ({
            id: media.id,
            type: media.mediaType,
            url: media.mediaUrl,
            contentType: media.mediaContentType,
            fileName: media.fileName,
            caption: media.caption,
            timestamp: media.timestamp
          })),
          author: params.Author,
          dateCreated: params.DateCreated
        });
        
        console.log('✅ Media message processed and broadcasted successfully');
      }
    } else if (numMedia === 0) {
      console.log('📝 Text-only message received (no media)');
    }
    
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error('❌ Error handling media webhook:', error);
    return new Response("error", { status: 500 });
  }
}

// Test endpoint to verify media webhook is reachable
export async function GET() {
  console.log('✅ Media webhook GET endpoint called - webhook is reachable');
  return new Response("Media webhook endpoint is working", { status: 200 });
}
