const axios = require('axios');

const BIRD_WEBHOOK_URL = 'http://localhost:3002/api/bird/webhook'; // Direct Bird webhook service
const PHONE_NUMBER = '+201066101340';

async function testBirdWebhookPdf() {
  console.log('🧪 Testing Bird webhook with PDF processing...');
  console.log('📱 Phone:', PHONE_NUMBER);
  console.log('🐦 Bird Webhook:', BIRD_WEBHOOK_URL);

  try {
    // Use the format that should trigger PDF processing
    const webhookPayload = {
      event: 'whatsapp.inbound',
      payload: {
        sender: {
          contact: {
            identifierValue: PHONE_NUMBER,
            identifierKey: 'phonenumber'
          }
        },
        body: {
          text: {
            body: 'عايز التقرير في صور',
            actions: [
              {
                type: 'postback',
                postback: {
                  text: 'عايز التقرير في صور',
                  payload: 'Image'  // This should trigger PDF processing
                }
              }
            ]
          }
        }
      }
    };

    console.log('📤 Sending Bird webhook payload...');
    console.log('📋 Payload:', JSON.stringify(webhookPayload, null, 2));

    const response = await axios.post(BIRD_WEBHOOK_URL, webhookPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('✅ Bird webhook successful!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));

    if (response.data.processed) {
      console.log('🎉 PDF processing was triggered!');
      console.log('📄 Images:', response.data.images);
      console.log('📁 Folder:', response.data.folder);
    } else {
      console.log('ℹ️ No PDF processing triggered');
    }

  } catch (error) {
    console.error('❌ Bird webhook failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testBirdWebhookPdf();
