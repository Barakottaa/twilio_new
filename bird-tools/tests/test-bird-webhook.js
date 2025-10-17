#!/usr/bin/env node

/**
 * Bird Webhook Test
 * Tests the Bird webhook endpoint with different event types
 */

const axios = require('axios');

// Configuration
const WEBHOOK_URL = 'http://localhost:3000/api/bird/webhook';
const TEST_PHONE = '+201016666348';

// Test webhook payloads
const testPayloads = {
  // Test postback event for InstaPay
  instapayPostback: {
    event: 'postback',
    payload: 'PAY_INSTAPAY',
    contact: {
      identifierValue: TEST_PHONE,
      identifierKey: 'phonenumber'
    },
    message: {
      id: 'test-message-1',
      text: 'User clicked InstaPay button'
    }
  },

  // Test postback event for VCash
  vcashPostback: {
    event: 'postback',
    payload: 'PAY_VCASH',
    contact: {
      identifierValue: TEST_PHONE,
      identifierKey: 'phonenumber'
    },
    message: {
      id: 'test-message-2',
      text: 'User clicked VCash button'
    }
  },

  // Test unknown postback
  unknownPostback: {
    event: 'postback',
    payload: 'UNKNOWN_PAYMENT',
    contact: {
      identifierValue: TEST_PHONE,
      identifierKey: 'phonenumber'
    },
    message: {
      id: 'test-message-3',
      text: 'User clicked unknown button'
    }
  },

  // Test message received event (should be ignored)
  messageReceived: {
    event: 'message.received',
    contact: {
      identifierValue: TEST_PHONE,
      identifierKey: 'phonenumber'
    },
    message: {
      id: 'test-message-4',
      text: 'Hello, this is a test message'
    }
  },

  // Test invalid payload
  invalidPayload: {
    event: 'postback',
    // Missing payload and contact
    message: {
      id: 'test-message-5',
      text: 'Invalid payload test'
    }
  }
};

async function testWebhook(payloadName, payload) {
  console.log(`\n🧪 Testing ${payloadName}...`);
  console.log('📤 Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Response received:');
    console.log(`   Status: ${response.status}`);
    console.log('📄 Response Data:', JSON.stringify(response.data, null, 2));

    return {
      success: true,
      status: response.status,
      data: response.data
    };

  } catch (error) {
    if (error.response) {
      console.error('❌ Error response:');
      console.error(`   Status: ${error.response.status}`);
      console.error('📄 Error Data:', JSON.stringify(error.response.data, null, 2));
      
      return {
        success: false,
        status: error.response.status,
        error: error.response.data
      };
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused - is the server running?');
      console.error('   Make sure to start your Next.js server with: npm run dev');
      
      return {
        success: false,
        error: 'Server not running'
      };
    } else {
      console.error('❌ Network error:', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

async function runAllTests() {
  console.log('🕊️ Testing Bird Webhook Endpoint');
  console.log(`📍 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`📱 Test Phone: ${TEST_PHONE}`);
  console.log('=' * 50);

  const results = {};

  // Test each payload
  for (const [testName, payload] of Object.entries(testPayloads)) {
    results[testName] = await testWebhook(testName, payload);
    
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('=' * 50);
  
  for (const [testName, result] of Object.entries(results)) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}`);
    if (!result.success && result.error) {
      console.log(`    Error: ${result.error}`);
    }
  }

  const passedTests = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🏁 Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your webhook is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.');
  }

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(results => {
      const allPassed = Object.values(results).every(r => r.success);
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testWebhook, runAllTests, testPayloads };
