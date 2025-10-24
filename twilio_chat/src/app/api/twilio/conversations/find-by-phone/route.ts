import { NextRequest, NextResponse } from 'next/server';
import { getTwilioClient } from '@/lib/twilio-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!phone) {
      return NextResponse.json({ 
        success: false, 
        error: 'Phone number is required' 
      }, { status: 400 });
    }

    console.log('🔍 Finding conversation by phone:', phone);

    const client = await getTwilioClient();
    
    // Get all conversations and filter by phone number
    const conversations = await client.conversations.v1.conversations.list({ 
      limit: Math.min(limit * 2, 100) // Get more to account for filtering
    });

    console.log('📞 Found conversations to filter:', conversations.length);

    // Filter conversations by phone number
    const matchingConversations = [];
    
    for (const conversation of conversations) {
      try {
        const participants = await client.conversations.v1
          .conversations(conversation.sid)
          .participants.list();
        
        // Find customer participant
        const customerParticipant = participants.find(p => {
          if (!p.identity) {
            // If identity is null, check if it's a WhatsApp participant (customer)
            return p.messagingBinding && p.messagingBinding.type === 'whatsapp';
          }
          return !p.identity.startsWith('agent-') && !p.identity.startsWith('admin-') && 
                 !p.identity.startsWith('agent_') && !p.identity.startsWith('admin_');
        });

        if (customerParticipant && customerParticipant.messagingBinding?.address) {
          const participantPhone = customerParticipant.messagingBinding.address.replace('whatsapp:', '');
          
          // Normalize both phones for comparison
          const { normalizePhoneNumber } = await import('@/lib/utils');
          const normalizedParticipantPhone = normalizePhoneNumber(participantPhone);
          const normalizedSearchPhone = normalizePhoneNumber(phone);
          
          console.log('🔍 Comparing phones:', {
            participant: normalizedParticipantPhone,
            search: normalizedSearchPhone,
            match: normalizedParticipantPhone === normalizedSearchPhone
          });
          
          if (normalizedParticipantPhone === normalizedSearchPhone) {
            matchingConversations.push({
              id: conversation.sid,
              friendlyName: conversation.friendlyName,
              dateCreated: conversation.dateCreated,
              dateUpdated: conversation.dateUpdated,
              state: conversation.state,
              participantPhone: normalizedParticipantPhone
            });
          }
        }
      } catch (error) {
        console.error('Error processing conversation:', conversation.sid, error);
        // Continue with other conversations
      }
    }

    console.log('✅ Found matching conversations:', matchingConversations.length);

    return NextResponse.json({
      success: true,
      items: matchingConversations,
      count: matchingConversations.length,
      phone: phone,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error finding conversation by phone:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      items: []
    }, { status: 500 });
  }
}

