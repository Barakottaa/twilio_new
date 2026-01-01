import { NextRequest, NextResponse } from 'next/server';
import { getTwilioConversations, listConversationsLite, getTwilioClient } from '@/lib/twilio-service';
import { ConversationService } from '@/lib/conversation-service';
import { getNumberById, getDefaultNumber, getWhatsAppNumber } from '@/lib/multi-number-config';
import { normalizePhoneNumber } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId') || 'admin_001'; // Default to admin
    const limit = parseInt(searchParams.get('limit') || '20');
    const conversationId = searchParams.get('conversationId'); // For fetching specific conversation
    const messageLimit = parseInt(searchParams.get('messageLimit') || '100'); // For fetching full chat history
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    const since = searchParams.get('since'); // For incremental updates
    const lite = searchParams.get('lite') === '1';
    const after = searchParams.get('after') ?? undefined;
    const numberId = searchParams.get('numberId'); // Filter by Twilio number ID
    const userId = searchParams.get('userId'); // Filter by User identity (optional - uses User Conversation Resource)

    if (lite) {
      // Fast lightweight list for initial load
      let { items, nextCursor } = await listConversationsLite(limit, after);
      
      // Filter by numberId if provided
      if (numberId) {
        items = items.filter(item => item.twilioNumberId === numberId);
      }
      
      return NextResponse.json({ 
        success: true,
        items, 
        nextCursor,
        count: items.length,
        timestamp: new Date().toISOString()
      });
    }
    
    let conversations;
    
    // If userId is provided, use User Conversation Resource to get conversations for that user
    if (userId && !conversationId) {
      try {
        const { getUserConversations } = await import('@/lib/user-conversations');
        const userConversationSids = await getUserConversations(userId, limit);
        
        // Fetch full conversation details for each SID
        const userConversationPromises = userConversationSids.map(sid => 
          getTwilioConversations(agentId, 1, sid, messageLimit)
        );
        
        const userConversationResults = await Promise.all(userConversationPromises);
        conversations = userConversationResults.flat();
        
        console.log(`✅ Fetched ${conversations.length} conversations for user ${userId}`);
      } catch (error) {
        console.warn('⚠️ Could not fetch conversations by user, falling back to all conversations:', error);
        // Fallback to regular conversation fetching
        conversations = await ConversationService.getConversations(agentId, limit, forceRefresh);
      }
    } else if (conversationId) {
      // For specific conversation, always fetch from Twilio for accuracy
      conversations = await getTwilioConversations(agentId, limit, conversationId, messageLimit);
    } else {
      // Use optimized local storage service
      conversations = await ConversationService.getConversations(agentId, limit, forceRefresh);
    }
    
    // Filter by numberId if provided
    if (numberId) {
      conversations = conversations.filter(conv => conv.twilioNumberId === numberId);
    }
    
    const response = NextResponse.json({
      success: true,
      conversations,
      count: conversations.length,
      cached: !forceRefresh && !conversationId, // Indicate if data is from cache
      timestamp: new Date().toISOString()
    });

    // Add aggressive caching headers for better performance
    if (!forceRefresh && !conversationId) {
      response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
    } else {
      response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      conversations: []
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, numberId, agentId = 'admin_001' } = body;

    if (!phoneNumber) {
      return NextResponse.json({ 
        error: 'phoneNumber is required' 
      }, { status: 400 });
    }

    console.log('📞 Creating conversation for phone number:', phoneNumber, 'with numberId:', numberId);

    const twilioClient = await getTwilioClient();

    // Determine which number to use
    let fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    if (numberId) {
      const numberConfig = getNumberById(numberId);
      if (numberConfig) {
        fromNumber = getWhatsAppNumber(numberConfig.number);
        console.log('✅ Using selected number for conversation:', numberConfig.name, `(${fromNumber})`);
      } else {
        console.warn('⚠️ Number ID not found:', numberId, '- falling back to default');
      }
    } else {
      const defaultNumber = getDefaultNumber();
      if (defaultNumber) {
        fromNumber = getWhatsAppNumber(defaultNumber.number);
        console.log('📱 Using default number for conversation:', defaultNumber.name, `(${fromNumber})`);
      }
    }

    // Normalize phone number using proper utility function
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const whatsappPhone = normalizedPhone.startsWith('whatsapp:') ? normalizedPhone : `whatsapp:${normalizedPhone}`;
    
    console.log('📱 Normalized phone number:', phoneNumber, '→', normalizedPhone);
    
    // Format phone number for uniqueName (remove non-digits)
    const phoneDigits = normalizedPhone.replace(/[^0-9]/g, '');
    const uniqueName = `whatsapp_${phoneDigits}`;

    // Check if conversation already exists
    try {
      const existingConversation = await twilioClient.conversations.v1.conversations(uniqueName).fetch();
      console.log('✅ Conversation already exists:', existingConversation.sid);
      
      // Return existing conversation
      const conversations = await getTwilioConversations(agentId, 1, existingConversation.sid, 0);
      return NextResponse.json({
        success: true,
        conversation: conversations[0] || {
          id: existingConversation.sid,
          customer: {
            id: uniqueName,
            name: normalizedPhone,
            phoneNumber: normalizedPhone,
            email: undefined
          },
          messages: [],
          status: 'open',
          createdAt: existingConversation.dateCreated?.toISOString() || new Date().toISOString(),
          updatedAt: existingConversation.dateUpdated?.toISOString() || new Date().toISOString()
        },
        alreadyExists: true
      });
    } catch (error: any) {
      // Conversation doesn't exist, create it
      if (error.code !== 20404) {
        throw error; // Re-throw if it's not a "not found" error
      }
    }

    // Create new conversation
    const conversation = await twilioClient.conversations.v1.conversations.create({
      friendlyName: `Chat with ${normalizedPhone}`,
      uniqueName: uniqueName
    });

    console.log('✅ Created new conversation:', conversation.sid);

    // Add customer as participant
    await twilioClient.conversations.v1
      .conversations(conversation.sid)
      .participants
      .create({
        'messagingBinding.address': whatsappPhone,
        'messagingBinding.proxyAddress': fromNumber
      });

    // Add system/agent as participant
    try {
      await twilioClient.conversations.v1
        .conversations(conversation.sid)
        .participants
        .create({
          identity: agentId
        });
    } catch (e: any) {
      // Participant might already exist, ignore
      if (e.code !== 50433) {
        console.warn('⚠️ Failed to add agent participant:', e.message);
      }
    }

    // Fetch the created conversation
    const conversations = await getTwilioConversations(agentId, 1, conversation.sid, 0);

    return NextResponse.json({
      success: true,
      conversation: conversations[0] || {
        id: conversation.sid,
        customer: {
          id: uniqueName,
          name: normalizedPhone,
          phoneNumber: normalizedPhone,
          email: undefined
        },
        messages: [],
        status: 'open',
        createdAt: conversation.dateCreated?.toISOString() || new Date().toISOString(),
        updatedAt: conversation.dateUpdated?.toISOString() || new Date().toISOString()
      },
      alreadyExists: false
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
