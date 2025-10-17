#!/usr/bin/env node

/**
 * Simple Bird Webhook Test
 * Quick test to verify the webhook endpoint is working
 */

const axios = require('axios');

const WEBHOOK_URL = 'http://localhost:3000/api/bird/webhook';

async function testWebhook() {
  console.log('🕊️ Testing Bird Webhook Endpoint...\n');

  // Test 1: Check if endpoint exists (GET should return 405)
  console.log('1️⃣ Testing GET request (should return 405)...');
  try {
    const getResponse = await axios.get(WEBHOOK_URL);
    console.log('❌ Unexpected: GET request succeeded');
  } catch (error) {
    if (error.response && error.response.status === 405) {
      console.log('✅ GET request correctly returns 405 (Method Not Allowed)');
    } else {
      console.log('❌ GET request failed with unexpected error:', error.message);
    }
  }

  // Test 2: Send a simple postback event
  console.log('\n2️⃣ Testing POST request with InstaPay postback...');
  
  const testPayload = {
    event: 'postback',
    payload: 'PAY_INSTAPAY',
    contact: {
      identifierValue: '+201016666348',
      identifierKey: 'phonenumber'
    },
    message: {
      id: 'test-message',
      text: 'Test message'
    }
  };

  try {
    const response = await axios.post(WEBHOOK_URL, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ POST request successful!');
    console.log(`   Status: ${response.status}`);
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));

    return true;

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused - is the server running?');
      console.error('   Start your server with: npm run dev');
      return false;
    } else if (error.response) {
      console.error('❌ POST request failed:');
      console.error(`   Status: ${error.response.status}`);
      console.error('📄 Error:', JSON.stringify(error.response.data, null, 2));
      return false;
    } else {
      console.error('❌ Network error:', error.message);
      return false;
    }
  }
}

// Run the test
testWebhook()
  .then(success => {
    if (success) {
      console.log('\n🎉 Webhook test completed successfully!');
      console.log('💡 The webhook should have sent a reply message to +201016666348');
    } else {
      console.log('\n❌ Webhook test failed');
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
  });
