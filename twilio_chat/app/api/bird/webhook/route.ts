import { NextRequest, NextResponse } from 'next/server';
import { sendBirdMessage, sendBirdImageMessage, uploadImageToBird } from '@/lib/bird-service';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

// Helper function to log to file
function logToFile(message: string) {
  try {
    const logDir = path.join(process.cwd(), '..', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'webhook-debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// 🟢 Bird Webhook endpoint
export async function POST(req: NextRequest) {
  try {
    logToFile('=== NEW WEBHOOK REQUEST ===');
    const body = await req.json();
    logToFile(`Incoming Body: ${JSON.stringify(body, null, 2)}`);
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
        const postbackAction = payload.body.text.actions.find((action: any) => action.type === 'postback');
        if (postbackAction) {
          postbackPayload = postbackAction.postback?.payload;
        }
      }
    }

    console.log('🔍 Extracted data:', { event, contact, postbackPayload });
    logToFile(`Extracted - Event: ${event}, Contact: ${contact}, Postback: ${postbackPayload}`);

    // Handle button clicks (postbacks) and text messages
    if (event === 'whatsapp.inbound' && contact) {
      logToFile('Processing whatsapp.inbound event');
      console.log('🎯 Processing webhook - event:', event, 'contact:', contact, 'postbackPayload:', postbackPayload);
      let replyText = '';
      let shouldConvertPdf = false;

      // Handle button clicks (postbacks)
      if (postbackPayload) {
        logToFile(`Postback payload found: ${postbackPayload}`);
        console.log('🎯 Postback payload found:', postbackPayload);
        const normalizedPayload = postbackPayload.trim().toLowerCase();
        logToFile(`Normalized payload: ${normalizedPayload}`);
        console.log('Checking postbackPayload:', postbackPayload, 'normalized:', normalizedPayload);

        if (normalizedPayload === 'pay_instapay') {
          logToFile('Matched: pay_instapay');
          replyText = 'ده رقم انستاباي 01005648997 حول عليه وابعت صورة التحويل علي رقم 01120035300';
        } else if (normalizedPayload === 'pay_vcash') {
          logToFile('Matched: pay_vcash');
          replyText = 'ده رقم فودافون كاش 01120035300 حول عليه وابعت صورة التحويل عشان نسجل التحويل';
        } else if (normalizedPayload === 'image') {
          logToFile('Matched: image - Setting up PDF conversion');
          shouldConvertPdf = true;
          replyText = 'جاري تحويل التقرير إلى صور وإرسالها لك...';
          console.log('🎯 Image postback detected - shouldConvertPdf:', shouldConvertPdf, 'replyText:', replyText);
        } else {
          logToFile(`Unhandled postback payload: ${postbackPayload}`);
          console.log('Unhandled postback payload:', postbackPayload);
        }
      }
      // Handle text messages containing "image"
      else if (payload.body?.text?.body) {
        const messageText = payload.body.text.body.toLowerCase();
        if (messageText.includes('image')) {
          shouldConvertPdf = true;
          replyText = 'جاري تحويل التقرير إلى صور وإرسالها لك...';
        }
      }

      // Send text reply if we have one
      if (replyText) {
        logToFile(`Sending text reply to ${contact}: ${replyText}`);
        try {
          const result = await sendBirdMessage(contact, replyText);
          logToFile(`Send result: ${JSON.stringify(result)}`);
          if (result.success) {
            console.log('✅ Reply sent successfully to', contact);
            logToFile(`✅ Reply sent successfully`);
          } else {
            console.log('⚠️ Reply failed:', result.error);
            logToFile(`⚠️ Reply failed: ${result.error}`);
            console.log('📝 Would have sent to', contact, ':', replyText);
          }
        } catch (error) {
          logToFile(`⚠️ Exception during send: ${error}`);
          console.log('⚠️ Bird message send failed:', error);
          console.log('📝 Would have sent to', contact, ':', replyText);
        }
      }

      // Convert PDF to images if requested
      if (shouldConvertPdf) {
        logToFile(`Starting PDF conversion for ${contact}`);
        try {
          console.log('🔄 Converting PDF to images for', contact);
          const pdfServiceUrl = 'http://localhost:3002/pdf-to-image';
          logToFile(`Calling PDF service at: ${pdfServiceUrl}`);
          const response = await fetch(pdfServiceUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              patient_number: contact,
              message: payload.body?.text?.body || 'image'
            })
          });

          if (response.ok) {
            const result = await response.json();
            logToFile(`PDF conversion response: ${JSON.stringify(result)}`);
            console.log('✅ PDF conversion successful:', result.message);
            
            // Send each converted image via WhatsApp
            if (result.images && result.images.length > 0) {
              logToFile(`Found ${result.images.length} images to send`);
              console.log(`📤 Sending ${result.images.length} images via WhatsApp`);
              
              for (const imageName of result.images) {
                try {
                  // Get the full path to the image file
                  const imagePath = `D:\\Results\\${result.folder}\\images\\${imageName}`;
                  console.log(`📸 Uploading image: ${imagePath} to Bird`);
                  
                  // Upload image to Bird and get media URL
                  const mediaUrl = await uploadImageToBird(imagePath);
                  console.log(`📤 Got media URL from Bird: ${mediaUrl}`);
                  
                  // Send the image via WhatsApp using the media URL
                  const imageResult = await sendBirdImageMessage(
                    contact, 
                    mediaUrl, 
                    `تقرير المعمل - صفحة ${result.images.indexOf(imageName) + 1}`
                  );
                  
                  if (imageResult.success) {
                    console.log(`✅ Image sent successfully: ${imageName}`);
                  } else {
                    console.log(`⚠️ Failed to send image ${imageName}:`, imageResult.error);
                  }
                  
                } catch (imageError) {
                  console.log('⚠️ Failed to send image:', imageError);
                }
              }
            }
          } else {
            logToFile(`⚠️ PDF conversion failed: ${response.statusText}`);
            console.log('⚠️ PDF conversion failed:', response.statusText);
          }
        } catch (error) {
          logToFile(`⚠️ PDF conversion error: ${error}`);
          console.log('⚠️ PDF conversion error:', error);
        }
      }

      if (!replyText && !shouldConvertPdf) {
        logToFile('No action configured for this message');
        console.log('ℹ️ No action configured for this message');
      }
    } else {
      logToFile(`Event not handled - Event: ${event}, hasContact: ${!!contact}, hasPostback: ${!!postbackPayload}`);
      console.log('ℹ️ Event not handled:', { event, hasContact: !!contact, hasPostback: !!postbackPayload });
    }

    logToFile('=== WEBHOOK REQUEST COMPLETED ===\n');
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
