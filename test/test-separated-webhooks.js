const axios = require('axios');

const BIRD_WEBHOOK_URL = 'http://localhost:3002/api/bird/webhook'; // Direct Bird webhook service
const TWILIO_WEBHOOK_URL = 'http://localhost:8080/api/bird/webhook'; // Twilio app webhook
const PHONE_NUMBER = '+201066101340';

async function testSeparatedWebhooks() {
  console.log('🧪 Testing separated webhooks...');
  console.log('📱 Phone:', PHONE_NUMBER);
  console.log('🐦 Bird Webhook:', BIRD_WEBHOOK_URL);
  console.log('📞 Twilio Webhook:', TWILIO_WEBHOOK_URL);

  // Test Bird webhook service (should handle PDF processing)
  console.log('\n🔵 Testing Bird Webhook Service...');
  try {
    const birdPayload = {
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
                  payload: 'Image'
                }
              }
            ]
          }
        }
      }
    };

    const birdResponse = await axios.post(BIRD_WEBHOOK_URL, birdPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('✅ Bird webhook successful!');
    console.log('📊 Status:', birdResponse.status);
    console.log('📋 Response:', JSON.stringify(birdResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Bird webhook failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }

  // Test Twilio webhook (should be simple, no Bird processing)
  console.log('\n🔵 Testing Twilio Webhook...');
  try {
    const twilioPayload = {
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
            body: 'Hello from Twilio'
          }
        }
      }
    };

    const twilioResponse = await axios.post(TWILIO_WEBHOOK_URL, twilioPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('✅ Twilio webhook successful!');
    console.log('📊 Status:', twilioResponse.status);
    console.log('📋 Response:', JSON.stringify(twilioResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Twilio webhook failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testSeparatedWebhooks();
