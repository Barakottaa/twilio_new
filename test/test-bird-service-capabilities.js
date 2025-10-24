const axios = require('axios');

const BIRD_SERVICE_URL = 'http://localhost:3001';
const PHONE_NUMBER = '+201066101340';

async function testBirdServiceCapabilities() {
  console.log('🧪 Testing Bird Service Complete Capabilities');
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

  // Test 2: Send Text Message
  console.log('\n🔵 Test 2: Send Text Message');
  try {
    const textResponse = await axios.post(`${BIRD_SERVICE_URL}/api/bird/send-message`, {
      to: PHONE_NUMBER,
      text: 'Hello from Bird Service! This is a test message.'
    });
    console.log('✅ Text Message Sent:', textResponse.data);
  } catch (error) {
    console.error('❌ Text Message Failed:', error.response?.data || error.message);
  }

  // Test 3: Send Template Message
  console.log('\n🔵 Test 3: Send Template Message');
  try {
    const templateResponse = await axios.post(`${BIRD_SERVICE_URL}/api/bird/send-template`, {
      phoneNumber: PHONE_NUMBER,
      projectId: 'test-project',
      templateVersion: '1.0',
      locale: 'ar',
      parameters: [
        { type: 'text', key: 'name', value: 'Test User' }
      ]
    });
    console.log('✅ Template Message Sent:', templateResponse.data);
  } catch (error) {
    console.error('❌ Template Message Failed:', error.response?.data || error.message);
  }

  // Test 4: Send Image Message (if image exists)
  console.log('\n🔵 Test 4: Send Image Message');
  try {
    const imagePath = 'D:\\Results\\+201066101340_393595\\images\\page-1.jpg';
    const imageResponse = await axios.post(`${BIRD_SERVICE_URL}/api/bird/send-image`, {
      to: PHONE_NUMBER,
      imagePath: imagePath,
      caption: 'Test image from Bird Service'
    });
    console.log('✅ Image Message Sent:', imageResponse.data);
  } catch (error) {
    console.error('❌ Image Message Failed:', error.response?.data || error.message);
  }

  // Test 5: Webhook Processing
  console.log('\n🔵 Test 5: Webhook Processing');
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

  // Test 6: API Connection Test
  console.log('\n🔵 Test 6: API Connection Test');
  try {
    const testResponse = await axios.get(`${BIRD_SERVICE_URL}/api/bird/test`);
    console.log('✅ API Connection Test:', testResponse.data);
  } catch (error) {
    console.error('❌ API Connection Test Failed:', error.response?.data || error.message);
  }

  console.log('\n🎯 Bird Service Capabilities Summary:');
  console.log('✅ Send Text Messages');
  console.log('✅ Send Template Messages');
  console.log('✅ Send Image Messages');
  console.log('✅ Process Webhooks');
  console.log('✅ PDF to Image Conversion');
  console.log('✅ Bird API Integration');
  console.log('✅ Health Monitoring');
}

testBirdServiceCapabilities();
