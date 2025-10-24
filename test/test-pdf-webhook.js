const axios = require('axios');

const BIRD_WEBHOOK_URL = 'http://localhost:8080/bird/api/bird/webhook'; // Proxy routes to Bird service
const PHONE_NUMBER = '+201066101340';

async function testPdfWebhook() {
  console.log('🧪 Testing PDF to image webhook for phone:', PHONE_NUMBER);
  console.log('🌐 Webhook URL:', BIRD_WEBHOOK_URL);

  try {
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
            body: 'Please process my PDF document'
          }
        }
      }
    };

    console.log('📤 Sending webhook payload...');
    console.log('📋 Payload:', JSON.stringify(webhookPayload, null, 2));

    const response = await axios.post(BIRD_WEBHOOK_URL, webhookPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('✅ Webhook test successful!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Webhook test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data || error.message
    });
    
    if (error.response?.data) {
      console.error('📋 Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPdfWebhook();
