const axios = require('axios');

const BIRD_SERVICE_URL = 'http://localhost:3001';
const BIRD_WEBHOOK_URL = 'http://localhost:3002/api/bird/webhook';
const TWILIO_WEBHOOK_URL = 'http://localhost:8080/api/bird/webhook';
const PHONE_NUMBER = '+201066101340';

async function testCompleteSeparation() {
  console.log('🧪 Testing Complete Bird/Twilio Separation');
  console.log('📱 Phone:', PHONE_NUMBER);
  console.log('🔧 Bird Service:', BIRD_SERVICE_URL);
  console.log('🐦 Bird Webhook:', BIRD_WEBHOOK_URL);
  console.log('📞 Twilio Webhook:', TWILIO_WEBHOOK_URL);

  // Test 1: Bird Service Health
  console.log('\n🔵 Test 1: Bird Service Health Check');
  try {
    const healthResponse = await axios.get(`${BIRD_SERVICE_URL}/health`);
    console.log('✅ Bird Service Health:', healthResponse.data);
  } catch (error) {
    console.error('❌ Bird Service Health Failed:', error.message);
  }

  // Test 2: Bird Service API Test
  console.log('\n🔵 Test 2: Bird Service API Test');
  try {
    const testResponse = await axios.get(`${BIRD_SERVICE_URL}/api/bird/test`);
    console.log('✅ Bird API Test:', testResponse.data);
  } catch (error) {
    console.error('❌ Bird API Test Failed:', error.message);
  }

  // Test 3: Bird Service Send Message
  console.log('\n🔵 Test 3: Bird Service Send Message');
  try {
    const messageResponse = await axios.post(`${BIRD_SERVICE_URL}/api/bird/send-message`, {
      to: PHONE_NUMBER,
      text: 'Test message from Bird Service'
    });
    console.log('✅ Bird Send Message:', messageResponse.data);
  } catch (error) {
    console.error('❌ Bird Send Message Failed:', error.message);
  }

  // Test 4: Bird Webhook Service
  console.log('\n🔵 Test 4: Bird Webhook Service');
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

    const webhookResponse = await axios.post(BIRD_WEBHOOK_URL, webhookPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    console.log('✅ Bird Webhook:', webhookResponse.data);
  } catch (error) {
    console.error('❌ Bird Webhook Failed:', error.message);
  }

  // Test 5: Twilio Webhook (should be simple)
  console.log('\n🔵 Test 5: Twilio Webhook (Simple)');
  try {
    const twilioPayload = {
      event: 'twilio.inbound',
      payload: {
        from: PHONE_NUMBER,
        body: 'Hello from Twilio'
      }
    };

    const twilioResponse = await axios.post(TWILIO_WEBHOOK_URL, twilioPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    console.log('✅ Twilio Webhook:', twilioResponse.data);
  } catch (error) {
    console.error('❌ Twilio Webhook Failed:', error.message);
  }

  console.log('\n🎯 Separation Test Complete!');
  console.log('📊 Summary:');
  console.log('- Bird Service: Handles all Bird API operations');
  console.log('- Bird Webhook: Handles WhatsApp webhooks and PDF processing');
  console.log('- Twilio Webhook: Simple webhook for Twilio-specific events');
  console.log('- No Bird API functions in Twilio app');
}

testCompleteSeparation();
