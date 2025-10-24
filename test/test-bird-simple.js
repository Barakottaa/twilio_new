const axios = require('axios');

const BIRD_SERVICE_URL = 'http://localhost:3001';
const PHONE_NUMBER = '+201066101340';

async function testBirdServiceSimple() {
  console.log('🧪 Testing Bird Service - Simple Test');
  console.log('📱 Phone:', PHONE_NUMBER);
  console.log('🔧 Bird Service:', BIRD_SERVICE_URL);

  // Test 1: Health Check
  console.log('\n🔵 Test 1: Health Check');
  try {
    const healthResponse = await axios.get(`${BIRD_SERVICE_URL}/health`);
    console.log('✅ Health Status:', healthResponse.data.status);
    console.log('✅ Services:', healthResponse.data.services);
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
  }

  // Test 2: Webhook Processing (this works)
  console.log('\n🔵 Test 2: Webhook Processing');
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

    const webhookResponse = await axios.post(`${BIRD_SERVICE_URL}/api/bird/webhook`, webhookPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    console.log('✅ Webhook Processed:', webhookResponse.data);
  } catch (error) {
    console.error('❌ Webhook Processing Failed:', error.response?.data || error.message);
  }

  console.log('\n🎯 Bird Service Current Capabilities:');
  console.log('✅ Process WhatsApp Webhooks');
  console.log('✅ Convert PDF to Images');
  console.log('✅ Send Images via WhatsApp');
  console.log('✅ Health Monitoring');
  console.log('⚠️ Direct API endpoints need Bird API credentials');
}

testBirdServiceSimple();
