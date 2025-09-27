import { NextRequest, NextResponse } from 'next/server';
import { addContact } from '@/lib/contact-mapping';

// Meta WhatsApp Business API webhook endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('📨 Meta webhook received:', JSON.stringify(body, null, 2));
    
    // Verify this is a WhatsApp message webhook
    if (body.object !== 'whatsapp_business_account') {
      console.log('⚠️ Not a WhatsApp business account webhook');
      return NextResponse.json({ message: 'Not a WhatsApp webhook' }, { status: 400 });
    }
    
    // Extract contact information from the webhook payload
    const entry = body.entry?.[0];
    if (!entry) {
      console.log('⚠️ No entry found in webhook');
      return NextResponse.json({ message: 'No entry found' }, { status: 400 });
    }
    
    const changes = entry.changes?.[0];
    if (!changes || changes.field !== 'messages') {
      console.log('⚠️ Not a messages webhook or no changes found');
      return NextResponse.json({ message: 'Not a messages webhook' }, { status: 400 });
    }
    
    const value = changes.value;
    const contacts = value.contacts;
    const messages = value.messages;
    
    // Process each contact
    if (contacts && contacts.length > 0) {
      for (const contact of contacts) {
        const contactName = contact.profile?.name;
        const waId = contact.wa_id;
        
        if (contactName && waId) {
          // Format phone number (add + prefix if not present)
          const phoneNumber = waId.startsWith('+') ? waId : `+${waId}`;
          
          console.log('👤 Processing contact:', {
            name: contactName,
            phoneNumber: phoneNumber,
            waId: waId
          });
          
          // Store contact in our mapping system
          // Use a default avatar for now - in production you could fetch profile picture
          const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=random`;
          
          addContact(phoneNumber, contactName, defaultAvatar);
          
          console.log('✅ Contact stored:', {
            phoneNumber,
            name: contactName,
            avatar: defaultAvatar
          });
        }
      }
    }
    
    // Process messages if needed (for future use)
    if (messages && messages.length > 0) {
      console.log('📨 Messages received:', messages.length);
      // You could process messages here if needed
    }
    
    return NextResponse.json({ 
      message: 'Webhook processed successfully',
      contactsProcessed: contacts?.length || 0,
      messagesProcessed: messages?.length || 0
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error processing Meta webhook:', error);
    return NextResponse.json({ 
      message: 'Webhook processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle webhook verification (GET request)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
  // Verify the webhook
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('✅ Meta webhook verified');
    return new Response(challenge, { status: 200 });
  } else {
    console.log('❌ Meta webhook verification failed');
    return NextResponse.json({ message: 'Verification failed' }, { status: 403 });
  }
}
