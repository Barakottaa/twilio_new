const axios = require('axios');

const NGROK_URL = 'https://undegenerated-nonviscidly-marylou.ngrok-free.dev/api/process-pdf';
const PHONE_NUMBER = '+201016666348';

async function testNgrokSimple() {
  console.log('🧪 Testing Ngrok PDF Processing (Simple)');
  console.log('📱 Phone:', PHONE_NUMBER);
  console.log('🌐 Ngrok URL:', NGROK_URL);

  try {
    const payload = {
      phoneNumber: PHONE_NUMBER,
      message: 'Please process my PDF document'
    };

    console.log('📤 Sending request to ngrok...');

    const response = await axios.post(NGROK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('✅ Ngrok test successful!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response data:', response.data);

  } catch (error) {
    console.error('❌ Ngrok test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data || error.message
    });
  }
}

testNgrokSimple();
