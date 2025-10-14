import { NextRequest, NextResponse } from 'next/server';
import { sendBirdMessage } from '@/lib/bird-service';

export const dynamic = 'force-dynamic';

// 🟢 Bird Webhook endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📩 Incoming Bird event:', JSON.stringify(body, null, 2));

    // Handle Bird's actual payload format
    const event = body.event;
    const payload = body.payload;
    
    // Extract contact info from the actual Bird format
    let contact = null;
    let postbackPayload = null;
    
    if (event === 'whatsapp.inbound' && payload) {
      // Get contact from sender
      contact = payload.sender?.contact?.identifierValue;
      
      // Check if there are actions with postback in the body.text.actions
      if (payload.body?.text?.actions && payload.body.text.actions.length > 0) {
        const postbackAction = payload.body.text.actions.find(action => action.type === 'postback');
        if (postbackAction) {
          postbackPayload = postbackAction.postback?.payload;
        }
      }
    }

    console.log('🔍 Extracted data:', { event, contact, postbackPayload });

    // Only handle button clicks (postbacks)
    if (event === 'whatsapp.inbound' && contact && postbackPayload) {
      let replyText = '';

      if (postbackPayload === 'PAY_INSTAPAY') {
        replyText = 'ده رقم انستاباي 01005648997 حول عليه وابعت صورة التحويل علي رقم 01120035300';
      } else if (postbackPayload === 'PAY_VCASH') {
        replyText = 'ده رقم فودافون كاش 01120035300 حول عليه وابعت صورة التحويل عشان نسجل التحويل';
      }

      if (replyText) {
        try {
          const result = await sendBirdMessage(contact, replyText);
          if (result.success) {
            console.log('✅ Reply sent successfully to', contact);
          } else {
            console.log('⚠️ Reply failed:', result.error);
            console.log('📝 Would have sent to', contact, ':', replyText);
          }
        } catch (error) {
          console.log('⚠️ Bird message send failed:', error);
          console.log('📝 Would have sent to', contact, ':', replyText);
        }
      } else {
        console.log('ℹ️ No reply configured for payload:', postbackPayload);
      }
    } else {
      console.log('ℹ️ Event not handled:', { event, hasContact: !!contact, hasPostback: !!postbackPayload });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ Bird webhook error:', err.message);
    console.error('❌ Error stack:', err.stack);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
