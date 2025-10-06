#!/usr/bin/env node

/**
 * Webhook Function Test Suite
 * Tests the Twilio webhook endpoints for proper functionality
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  verbose: process.env.VERBOSE === 'true'
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Twilio-Webhook-Test/1.0',
        ...options.headers
      },
      timeout: TEST_CONFIG.timeout
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test functions
async function testWebhookConnectivity() {
  log('Testing webhook connectivity...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/twilio/conversations-events`, {
      method: 'POST',
      body: 'EventType=test&TestParam=connectivity'
    });
    
    if (response.statusCode === 200) {
      log('Webhook endpoint is reachable', 'success');
      return true;
    } else {
      log(`Webhook returned status ${response.statusCode}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Webhook connectivity test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testMessageAddedEvent() {
  log('Testing onMessageAdded event handling...');
  
  const testParams = new URLSearchParams({
    EventType: 'onMessageAdded',
    ConversationSid: 'CH_test_conversation_123',
    MessageSid: 'IM_test_message_456',
    Body: 'Test message from webhook test',
    Author: 'whatsapp:+1234567890',
    ParticipantSid: 'MB_test_participant_789',
    DateCreated: new Date().toISOString(),
    Index: '0',
    ChatServiceSid: 'IS_test_service_123'
  });

  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/twilio/conversations-events`, {
      method: 'POST',
      body: testParams.toString()
    });
    
    if (response.statusCode === 200 && response.body.trim() === 'ok') {
      log('onMessageAdded event handled successfully', 'success');
      return true;
    } else {
      log(`onMessageAdded test failed: Status ${response.statusCode}, Body: ${response.body}`, 'error');
      return false;
    }
  } catch (error) {
    log(`onMessageAdded test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testConversationAddedEvent() {
  log('Testing onConversationAdded event handling...');
  
  const testParams = new URLSearchParams({
    EventType: 'onConversationAdded',
    ConversationSid: 'CH_test_new_conversation_123',
    FriendlyName: 'Test Conversation',
    DateCreated: new Date().toISOString()
  });

  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/twilio/conversations-events`, {
      method: 'POST',
      body: testParams.toString()
    });
    
    if (response.statusCode === 200 && response.body.trim() === 'ok') {
      log('onConversationAdded event handled successfully', 'success');
      return true;
    } else {
      log(`onConversationAdded test failed: Status ${response.statusCode}, Body: ${response.body}`, 'error');
      return false;
    }
  } catch (error) {
    log(`onConversationAdded test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testMediaMessageEvent() {
  log('Testing media message event handling...');
  
  const mediaData = JSON.stringify([{
    Sid: 'ME_test_media_123',
    ContentType: 'image/jpeg',
    Filename: 'test-image.jpg',
    Size: 1024
  }]);

  const testParams = new URLSearchParams({
    EventType: 'onMessageAdded',
    ConversationSid: 'CH_test_media_conversation_123',
    MessageSid: 'IM_test_media_message_456',
    Body: 'Test media message',
    Author: 'whatsapp:+1234567890',
    ParticipantSid: 'MB_test_media_participant_789',
    Media: mediaData,
    DateCreated: new Date().toISOString(),
    Index: '0',
    ChatServiceSid: 'IS_test_service_123'
  });

  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/twilio/conversations-events`, {
      method: 'POST',
      body: testParams.toString()
    });
    
    if (response.statusCode === 200 && response.body.trim() === 'ok') {
      log('Media message event handled successfully', 'success');
      return true;
    } else {
      log(`Media message test failed: Status ${response.statusCode}, Body: ${response.body}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Media message test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testInvalidEventType() {
  log('Testing invalid event type handling...');
  
  const testParams = new URLSearchParams({
    EventType: 'onInvalidEvent',
    TestParam: 'test'
  });

  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/twilio/conversations-events`, {
      method: 'POST',
      body: testParams.toString()
    });
    
    if (response.statusCode === 200 && response.body.trim() === 'ok') {
      log('Invalid event type handled gracefully', 'success');
      return true;
    } else {
      log(`Invalid event type test failed: Status ${response.statusCode}, Body: ${response.body}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Invalid event type test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testMalformedRequest() {
  log('Testing malformed request handling...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/twilio/conversations-events`, {
      method: 'POST',
      body: 'invalid-form-data'
    });
    
    // Should handle gracefully even with malformed data
    if (response.statusCode === 200 || response.statusCode === 400) {
      log('Malformed request handled appropriately', 'success');
      return true;
    } else {
      log(`Malformed request test failed: Status ${response.statusCode}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Malformed request test failed: ${error.message}`, 'error');
    return false;
  }
}

// Test runner
async function runTest(testName, testFunction) {
  testResults.total++;
  log(`\n🧪 Running test: ${testName}`);
  
  try {
    const startTime = Date.now();
    const result = await testFunction();
    const duration = Date.now() - startTime;
    
    if (result) {
      testResults.passed++;
      testResults.details.push({ name: testName, status: 'PASSED', duration });
      log(`✅ ${testName} - PASSED (${duration}ms)`, 'success');
    } else {
      testResults.failed++;
      testResults.details.push({ name: testName, status: 'FAILED', duration });
      log(`❌ ${testName} - FAILED (${duration}ms)`, 'error');
    }
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'ERROR', duration: 0, error: error.message });
    log(`❌ ${testName} - ERROR: ${error.message}`, 'error');
  }
}

// Main test execution
async function runWebhookTests() {
  log('🚀 Starting Webhook Function Tests');
  log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  log(`Timeout: ${TEST_CONFIG.timeout}ms`);
  log(`Verbose: ${TEST_CONFIG.verbose}`);
  
  const tests = [
    ['Webhook Connectivity', testWebhookConnectivity],
    ['Message Added Event', testMessageAddedEvent],
    ['Conversation Added Event', testConversationAddedEvent],
    ['Media Message Event', testMediaMessageEvent],
    ['Invalid Event Type', testInvalidEventType],
    ['Malformed Request', testMalformedRequest]
  ];
  
  for (const [testName, testFunction] of tests) {
    await runTest(testName, testFunction);
  }
  
  // Print summary
  log('\n📊 Test Summary:');
  log(`Total Tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`, testResults.passed > 0 ? 'success' : 'info');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (TEST_CONFIG.verbose && testResults.details.length > 0) {
    log('\n📋 Detailed Results:');
    testResults.details.forEach(detail => {
      const status = detail.status === 'PASSED' ? '✅' : '❌';
      log(`${status} ${detail.name}: ${detail.status} (${detail.duration}ms)`);
      if (detail.error) {
        log(`   Error: ${detail.error}`);
      }
    });
  }
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Webhook Function Test Suite

Usage: node test-webhook.js [options]

Options:
  --base-url <url>    Base URL for the application (default: http://localhost:3000)
  --timeout <ms>      Request timeout in milliseconds (default: 10000)
  --verbose           Enable verbose output
  --help, -h          Show this help message

Environment Variables:
  TEST_BASE_URL       Base URL for the application
  VERBOSE             Enable verbose output (true/false)

Examples:
  node test-webhook.js
  node test-webhook.js --base-url https://myapp.com --verbose
  TEST_BASE_URL=https://staging.myapp.com node test-webhook.js
`);
    process.exit(0);
  }
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--base-url':
        TEST_CONFIG.baseUrl = args[++i];
        break;
      case '--timeout':
        TEST_CONFIG.timeout = parseInt(args[++i]);
        break;
      case '--verbose':
        TEST_CONFIG.verbose = true;
        break;
    }
  }
  
  runWebhookTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runWebhookTests,
  testWebhookConnectivity,
  testMessageAddedEvent,
  testConversationAddedEvent,
  testMediaMessageEvent,
  testInvalidEventType,
  testMalformedRequest
};
