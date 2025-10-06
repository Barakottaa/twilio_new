#!/usr/bin/env node

/**
 * Test script to demonstrate development mode SSE issues
 * Run this while development server is running to simulate the problems
 */

const EventSource = require('eventsource');

console.log('🧪 Testing Development Mode SSE Issues\n');

// Test 1: Simulate hot reload scenario
async function testHotReloadScenario() {
  console.log('📋 Test 1: Hot Reload Scenario');
  console.log('1. Connect to SSE...');
  
  const eventSource = new EventSource('http://localhost:3000/api/events');
  
  eventSource.onopen = () => {
    console.log('✅ SSE connected');
  };
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'connected') {
      console.log('✅ Received connection confirmation');
    } else if (data.type === 'newMessage') {
      console.log('📨 Received message:', data.data.body);
    } else if (data.type === 'heartbeat') {
      console.log('💓 Heartbeat received');
    }
  };
  
  eventSource.onerror = (error) => {
    console.log('❌ SSE connection error (simulating hot reload)');
    console.log('   This happens when Next.js restarts the server');
  };
  
  // Simulate hot reload after 5 seconds
  setTimeout(() => {
    console.log('🔄 Simulating hot reload (server restart)...');
    eventSource.close();
    
    // Reconnect after "restart"
    setTimeout(() => {
      console.log('🔄 Reconnecting after "restart"...');
      const newEventSource = new EventSource('http://localhost:3000/api/events');
      
      newEventSource.onopen = () => {
        console.log('✅ Reconnected successfully');
        console.log('📨 Any queued messages should be delivered now');
      };
      
      newEventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'newMessage') {
          console.log('📨 Received queued message:', data.data.body);
        }
      };
      
    }, 2000);
  }, 5000);
}

// Test 2: Message queueing when webhook is down
async function testWebhookDownScenario() {
  console.log('\n📋 Test 2: Webhook Down Scenario');
  console.log('1. Start with webhook running');
  console.log('2. Send WhatsApp message → Should work');
  console.log('3. Stop webhook (kill ngrok)');
  console.log('4. Send WhatsApp message → Will fail (no webhook)');
  console.log('5. Restart webhook');
  console.log('6. Send WhatsApp message → Should work again');
  console.log('7. Check if previous messages are queued');
  
  console.log('\n⚠️  Manual test required:');
  console.log('   - Send message with webhook up');
  console.log('   - Stop ngrok: Ctrl+C in ngrok terminal');
  console.log('   - Send message (will fail silently)');
  console.log('   - Restart ngrok');
  console.log('   - Send message (should work)');
  console.log('   - Check if missed messages appear');
}

// Test 3: Connection stability
async function testConnectionStability() {
  console.log('\n📋 Test 3: Connection Stability');
  
  const eventSource = new EventSource('http://localhost:3000/api/events');
  let messageCount = 0;
  let heartbeatCount = 0;
  
  eventSource.onopen = () => {
    console.log('✅ SSE connected');
  };
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'newMessage') {
      messageCount++;
      console.log(`📨 Message ${messageCount}:`, data.data.body);
    } else if (data.type === 'heartbeat') {
      heartbeatCount++;
      if (heartbeatCount % 10 === 0) {
        console.log(`💓 Heartbeat ${heartbeatCount} (connection stable)`);
      }
    }
  };
  
  eventSource.onerror = (error) => {
    console.log('❌ Connection lost, will attempt to reconnect...');
  };
  
  // Monitor for 30 seconds
  setTimeout(() => {
    console.log(`\n📊 Results after 30 seconds:`);
    console.log(`   - Messages received: ${messageCount}`);
    console.log(`   - Heartbeats received: ${heartbeatCount}`);
    console.log(`   - Connection status: ${eventSource.readyState === EventSource.OPEN ? 'Open' : 'Closed'}`);
    eventSource.close();
  }, 30000);
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Development Mode Tests...\n');
  
  // Test 1: Hot reload scenario
  await testHotReloadScenario();
  
  // Wait a bit before next test
  setTimeout(() => {
    testWebhookDownScenario();
  }, 10000);
  
  // Wait a bit before next test
  setTimeout(() => {
    testConnectionStability();
  }, 15000);
}

// Check if server is running
fetch('http://localhost:3000/api/events')
  .then(() => {
    console.log('✅ Server is running, starting tests...\n');
    runTests();
  })
  .catch(() => {
    console.log('❌ Server is not running. Please start with: npm run dev');
    process.exit(1);
  });
