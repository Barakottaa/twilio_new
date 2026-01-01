import { NextRequest, NextResponse } from 'next/server';
import { logTwilioWebhook, logInfo, logWarn, logError } from '@/lib/logger';

/**
 * Webhook endpoint for Twilio Messaging Service incoming messages
 * This endpoint receives ProfileName which is NOT available in Conversations Events webhooks
 * 
 * IMPORTANT: This is different from conversations-events webhook:
 * - Messaging Service webhook: Includes ProfileName, but doesn't have ConversationSid
 * - Conversations Events webhook: Has ConversationSid, but NO ProfileName
 * 
 * We need BOTH webhooks to get complete information:
 * 1. This webhook extracts ProfileName and stores it
 * 2. Conversations Events webhook handles the message in the conversation
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const params = Object.fromEntries(formData.entries());

    // Log all incoming webhook data
    logTwilioWebhook('Messaging-Service', params);

    const from = params.From as string;
    const to = params.To as string;
    const body = params.Body as string;
    const messageSid = params.MessageSid as string;
    const profileName = params.ProfileName as string; // THIS IS THE KEY FIELD WE NEED!
    const smsStatus = params.SmsStatus as string;
    const messageType = params.MessageType as string;
    const numMedia = params.NumMedia as string;

    console.log('📩 Messaging Service webhook received:', {
      from,
      to,
      body,
      messageSid,
      profileName: profileName || '(MISSING)',
      smsStatus,
      messageType,
      numMedia,
      timestamp: new Date().toISOString()
    });

    logInfo('📩 Processing Messaging Service webhook', {
      from,
      to,
      body,
      messageSid,
      profileName: profileName || '(MISSING)',
      smsStatus,
      allParams: params
    });

    // Extract phone number from From field
    if (!from) {
      logWarn('⚠️ No From field in Messaging Service webhook', params);
      return NextResponse.json({
        success: false,
        error: 'From field is required'
      }, { status: 400 });
    }

    // Extract phone number (remove whatsapp: prefix)
    const phoneMatch = from.match(/whatsapp:\s*(\+?\d+)/);
    const rawPhone = phoneMatch ? phoneMatch[1] : from.replace(/^whatsapp:/, '');

    // Normalize phone number
    const { normalizePhoneNumber } = await import('@/lib/utils');
    const normalizedPhone = normalizePhoneNumber(rawPhone);

    console.log('📱 Extracted phone:', normalizedPhone);
    console.log('👤 ProfileName from webhook:', profileName || '(NOT PROVIDED)');

    // CRITICAL: Store ProfileName if provided
    if (profileName && profileName.trim() !== '') {
      logInfo('✅ ProfileName found in Messaging Service webhook', {
        profileName,
        phone: normalizedPhone,
        messageSid
      });

      // Store contact in database via contacts service
      try {
        console.log('✅ ProfileName found in Messaging Service webhook:', profileName);

        const { autoCreateOrUpdateContact } = await import('@/lib/contacts-service');
        await autoCreateOrUpdateContact({
          name: profileName,
          phoneNumber: normalizedPhone,
          profileName: profileName
        });

        console.log('✅ Contact created/updated in database:', profileName);
        logInfo('✅ Contact created/updated in database', {
          phone: normalizedPhone,
          name: profileName
        });
      } catch (dbError) {
        console.error('⚠️ Error storing contact in database:', dbError);
        // Don't fail the webhook if DB storage fails
      }
    } else {
      logWarn('⚠️ ProfileName is MISSING in Messaging Service webhook', {
        phone: normalizedPhone,
        messageSid,
        allParams: Object.keys(params)
      });
    }

    // Find conversation by phone number
    try {
      const { getTwilioClient } = await import('@/lib/twilio-service');
      const twilioClient = await getTwilioClient();

      // List conversations and find one with this phone number
      const conversations = await twilioClient.conversations.v1.conversations.list({ limit: 50 });

      let conversationSid: string | null = null;
      for (const conv of conversations) {
        try {
          const participants = await twilioClient.conversations.v1
            .conversations(conv.sid)
            .participants.list();

          const customerParticipant = participants.find(p =>
            p.messagingBinding?.address === from ||
            p.messagingBinding?.address === `whatsapp:${normalizedPhone}`
          );

          if (customerParticipant) {
            conversationSid = conv.sid;
            console.log('✅ Found conversation:', conversationSid);
            break;
          }
        } catch (err) {
          // Continue checking other conversations
        }
      }

      if (conversationSid) {
        // Update conversation title with ProfileName if we have it
        if (profileName && profileName.trim() !== '') {
          try {
            // Update participant display_name attribute
            const participants = await twilioClient.conversations.v1
              .conversations(conversationSid)
              .participants.list();

            const customerParticipant = participants.find(p =>
              p.messagingBinding?.address === from
            );

            if (customerParticipant) {
              // Update participant attributes with ProfileName
              await twilioClient.conversations.v1
                .conversations(conversationSid)
                .participants(customerParticipant.sid)
                .update({
                  attributes: JSON.stringify({
                    display_name: profileName,
                    phone: normalizedPhone
                  })
                });

              console.log('✅ Updated participant display_name:', profileName);
              logInfo('✅ Updated participant display_name', {
                conversationSid,
                profileName,
                participantSid: customerParticipant.sid
              });
            }
          } catch (updateError) {
            console.error('⚠️ Error updating participant:', updateError);
            // Don't fail the webhook
          }
        }
      }
    } catch (convError) {
      console.error('⚠️ Error finding conversation:', convError);
      // Don't fail the webhook if conversation lookup fails
    }

    // Return success to Twilio
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error processing Messaging Service webhook:', error);
    logError('❌ Error processing Messaging Service webhook', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

