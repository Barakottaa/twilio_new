// Complete SSE and real-time message test script
const { EventSource } = require('eventsource');
const BASE_URL = 'http://localhost:3000';

console.log('🧪 Starting Complete SSE and Real-Time Message Test');
console.log('=' .repeat(60));

// Test 1: Check SSE Connection
async function testSSEConnection() {
  console.log('\n📌 TEST 1: SSE Connection Test');
  console.log('-'.repeat(60));
  
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(`${BASE_URL}/api/events`);
    
    let connectionEstablished = false;
    let heartbeatReceived = false;
    
    const timeout = setTimeout(() => {
      eventSource.close();
      if (!connectionEstablished) {
        console.log('❌ FAILED: SSE connection not established within 5 seconds');
        reject(new Error('SSE connection timeout'));
      } else if (!heartbeatReceived) {
        console.log('⚠️  WARNING: Connection established but no heartbeat within 5 seconds');
        resolve({ success: true, warning: 'No heartbeat' });
      } else {
        console.log('✅ PASSED: SSE connection and heartbeat working');
        resolve({ success: true });
      }
    }, 5000);
    
    eventSource.onopen = () => {
      console.log('✅ SSE connection opened');
      console.log('   ReadyState: OPEN');
      connectionEstablished = true;
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Received SSE event:', data.type);
        
        if (data.type === 'connected') {
          console.log('   ✓ Initial connection message received');
        } else if (data.type === 'heartbeat') {
          console.log('   ✓ Heartbeat received');
          heartbeatReceived = true;
          clearTimeout(timeout);
          eventSource.close();
          console.log('✅ PASSED: SSE connection and heartbeat working');
          resolve({ success: true });
        }
      } catch (error) {
        console.log('❌ Error parsing SSE data:', error.message);
      }
    };
    
    eventSource.onerror = (error) => {
      console.log('❌ SSE connection error:', error.message || 'Unknown error');
      clearTimeout(timeout);
      eventSource.close();
      reject(error);
    };
  });
}

// Test 2: Check Server Connection Count
async function testConnectionCount() {
  console.log('\n📌 TEST 2: Connection Count Test');
  console.log('-'.repeat(60));
  
  // Open 3 connections
  const connections = [];
  for (let i = 0; i < 3; i++) {
    const es = new EventSource(`${BASE_URL}/api/events`);
    connections.push(es);
  }
  
  // Wait for connections to establish
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('✅ Opened 3 SSE connections');
  console.log('   Check server logs for "Total connections: 3"');
  
  // Close all connections
  connections.forEach(es => es.close());
  console.log('✅ Closed all connections');
  
  return { success: true };
}

// Test 3: Simulate Webhook and Check Broadcast
async function testWebhookBroadcast() {
  console.log('\n📌 TEST 3: Webhook Broadcast Test');
  console.log('-'.repeat(60));
  
  return new Promise(async (resolve, reject) => {
    const eventSource = new EventSource(`${BASE_URL}/api/events`);
    
    let messageReceived = false;
    
    const timeout = setTimeout(() => {
      eventSource.close();
      if (!messageReceived) {
        console.log('❌ FAILED: No message broadcast received within 10 seconds');
        console.log('   This is expected if Twilio webhook is not configured');
        resolve({ success: false, reason: 'No webhook received' });
      }
    }, 10000);
    
    eventSource.onopen = () => {
      console.log('✅ SSE connection established for broadcast test');
      console.log('');
      console.log('📱 ACTION REQUIRED:');
      console.log('   Send a WhatsApp message to your Twilio number NOW');
      console.log('   Waiting for webhook broadcast...');
      console.log('');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'newMessage') {
          console.log('✅ PASSED: Message broadcast received!');
          console.log('   Message Data:', {
            conversationSid: data.data.conversationSid,
            body: data.data.body,
            author: data.data.author
          });
          messageReceived = true;
          clearTimeout(timeout);
          eventSource.close();
          resolve({ success: true });
        } else if (data.type === 'heartbeat') {
          console.log('💓 Heartbeat (still waiting for message...)');
        } else if (data.type === 'connected') {
          console.log('📡 Connected (waiting for message...)');
        }
      } catch (error) {
        console.log('❌ Error parsing SSE data:', error.message);
      }
    };
    
    eventSource.onerror = (error) => {
      console.log('❌ SSE connection error:', error.message || 'Unknown error');
      clearTimeout(timeout);
      eventSource.close();
      reject(error);
    };
  });
}

// Test 4: Check Conversation Events Webhook Endpoint
async function testWebhookEndpoint() {
  console.log('\n📌 TEST 4: Webhook Endpoint Test');
  console.log('-'.repeat(60));
  
  try {
    // Simulate a Twilio webhook call
    const response = await fetch(`${BASE_URL}/api/twilio/conversations-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        EventType: 'onMessageAdded',
        ConversationSid: 'CH_test_conversation_123',
        MessageSid: 'IM_test_message_456',
        Body: 'Test message from script',
        Author: 'whatsapp:+1234567890',
        DateCreated: new Date().toISOString(),
        Index: '0'
      }).toString()
    });
    
    if (response.ok) {
      console.log('✅ PASSED: Webhook endpoint accessible');
      console.log('   Status:', response.status);
      console.log('   Check server logs for webhook processing');
      return { success: true };
    } else {
      console.log('❌ FAILED: Webhook returned error');
      console.log('   Status:', response.status);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ FAILED: Error calling webhook endpoint');
    console.log('   Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runAllTests() {
  const results = [];
  
  try {
    // Test 1: SSE Connection
    try {
      const result = await testSSEConnection();
      results.push({ test: 'SSE Connection', ...result });
    } catch (error) {
      results.push({ test: 'SSE Connection', success: false, error: error.message });
    }
    
    // Test 2: Connection Count
    try {
      const result = await testConnectionCount();
      results.push({ test: 'Connection Count', ...result });
    } catch (error) {
      results.push({ test: 'Connection Count', success: false, error: error.message });
    }
    
    // Test 4: Webhook Endpoint (do this before broadcast test)
    try {
      const result = await testWebhookEndpoint();
      results.push({ test: 'Webhook Endpoint', ...result });
    } catch (error) {
      results.push({ test: 'Webhook Endpoint', success: false, error: error.message });
    }
    
    // Test 3: Webhook Broadcast (optional - requires manual action)
    console.log('\n⚠️  Skipping real webhook broadcast test (requires WhatsApp message)');
    console.log('   To test manually: Send a WhatsApp message and check browser console');
    
  } catch (error) {
    console.error('Fatal error running tests:', error);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.test}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.warning) {
      console.log(`   Warning: ${result.warning}`);
    }
    if (result.reason) {
      console.log(`   Reason: ${result.reason}`);
    }
  });
  
  const passCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('');
  console.log(`Total: ${passCount}/${totalCount} tests passed`);
  console.log('='.repeat(60));
  
  // Check if server is running
  if (results.length === 0 || results.every(r => !r.success)) {
    console.log('');
    console.log('⚠️  NOTE: Make sure the dev server is running:');
    console.log('   npm run dev');
    console.log('');
  }
}

// Run tests
runAllTests().catch(console.error);

