#!/usr/bin/env node

/**
 * Simple Test Suite - Quick verification of core functionality
 */

const http = require('http');
const fs = require('fs');

const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 5000
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? require('https') : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Test-Suite/1.0',
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

async function testWebhookEndpoint() {
  log('Testing webhook endpoint...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/twilio/conversations-events`, {
      method: 'POST',
      body: 'EventType=onMessageAdded&ConversationSid=CH_test&MessageSid=IM_test&Body=Test&Author=whatsapp:+1234567890'
    });
    
    if (response.statusCode === 200) {
      log('✅ Webhook endpoint is working', 'success');
      return true;
    } else {
      log(`❌ Webhook returned status ${response.statusCode}`, 'error');
      return false;
    }
  } catch (error) {
    log(`❌ Webhook test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testSSEEndpoint() {
  log('Testing SSE endpoint...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/events`, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response.statusCode === 200 && response.headers['content-type']?.includes('text/event-stream')) {
      log('✅ SSE endpoint is working', 'success');
      return true;
    } else {
      log(`❌ SSE returned status ${response.statusCode}`, 'error');
      return false;
    }
  } catch (error) {
    log(`❌ SSE test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testDatabaseFile() {
  log('Testing database file...');
  
  try {
    const dbPath = './database.sqlite';
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      if (stats.size > 0) {
        log('✅ Database file exists and has content', 'success');
        return true;
      } else {
        log('⚠️ Database file exists but is empty', 'warning');
        return true; // Still consider it working
      }
    } else {
      log('❌ Database file does not exist', 'error');
      return false;
    }
  } catch (error) {
    log(`❌ Database file test failed: ${error.message}`, 'error');
    return false;
  }
}

async function testApplicationHealth() {
  log('Testing application health...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/`, {
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      log('✅ Application is responding', 'success');
      return true;
    } else {
      log(`❌ Application returned status ${response.statusCode}`, 'error');
      return false;
    }
  } catch (error) {
    log(`❌ Application health test failed: ${error.message}`, 'error');
    return false;
  }
}

async function runSimpleTests() {
  log('🚀 Starting Simple Tests');
  log(`Base URL: ${TEST_CONFIG.baseUrl}`);
  
  const tests = [
    ['Application Health', testApplicationHealth],
    ['Webhook Endpoint', testWebhookEndpoint],
    ['SSE Endpoint', testSSEEndpoint],
    ['Database File', testDatabaseFile]
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const [testName, testFunction] of tests) {
    log(`\n🧪 Running: ${testName}`);
    try {
      const result = await testFunction();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log(`❌ ${testName} failed: ${error.message}`, 'error');
      failed++;
    }
  }
  
  log('\n📊 Simple Test Results:');
  log(`✅ Passed: ${passed}`);
  log(`❌ Failed: ${failed}`);
  log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    log('\n🎉 All core systems are working!', 'success');
  } else {
    log('\n⚠️ Some issues detected - check the failed tests above', 'warning');
  }
  
  return failed === 0;
}

if (require.main === module) {
  runSimpleTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runSimpleTests };
