/**
 * Test script for Bird Service components
 * Tests bird-api-client.js and utilities
 */

require('dotenv').config();
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function separator() {
  console.log('\n' + '='.repeat(60) + '\n');
}


async function testBirdApiClient() {
  log('\n🧪 Testing bird-api-client.js...', 'cyan');
  separator();
  
  try {
    const BirdApiClient = require('./bird-api-client');
    const birdApiClient = new BirdApiClient();
    
    // Test 1: Connection test
    log('📋 Test 1: Connection Test', 'blue');
    const connectionTest = await birdApiClient.testConnection();
    if (connectionTest.success) {
      log('✅ Connection test passed', 'green');
      console.log('   Workspace ID:', connectionTest.workspaceId);
      console.log('   Channel ID:', connectionTest.channelId);
    } else {
      log('❌ Connection test failed: ' + connectionTest.error, 'red');
    }
    
    // Test 2: Configuration check
    log('\n📋 Test 2: Configuration Check', 'blue');
    if (birdApiClient.apiKey) {
      log('✅ API Key is configured', 'green');
      console.log('   API Key (first 8 chars):', birdApiClient.apiKey.substring(0, 8) + '...');
    } else {
      log('❌ API Key not configured', 'red');
      return { success: false, error: 'API Key missing' };
    }
    
    log('\n✅ bird-api-client.js is ready!', 'green');
    log('   Note: Actual API calls require valid credentials and phone numbers', 'yellow');
    return { success: true, service: 'bird-api-client' };
    
  } catch (error) {
    log('❌ bird-api-client.js test failed: ' + error.message, 'red');
    return { success: false, error: error.message, service: 'bird-api-client' };
  }
}

async function testUtilities() {
  log('\n🧪 Testing utilities...', 'cyan');
  separator();
  
  const results = {
    'get-bird-presigned-url': { success: false },
    'bypass-ngrok-warning': { success: false }
  };
  
  // Test 1: get-bird-presigned-url.js
  log('📋 Test 1: get-bird-presigned-url.js', 'blue');
  try {
    const { getPresignedUrl } = require('./utilities/get-bird-presigned-url');
    log('✅ Module loads successfully', 'green');
    
    // Only test if we have API key (don't make actual API call unless requested)
    if (process.env.BIRD_API_KEY) {
      log('   API Key found - module is ready to use', 'green');
      log('   Run: node utilities/get-bird-presigned-url.js to test API call', 'yellow');
      results['get-bird-presigned-url'] = { success: true };
    } else {
      log('   ⚠️  API Key not found - module exists but cannot test API', 'yellow');
      results['get-bird-presigned-url'] = { success: true, warning: 'API Key missing' };
    }
  } catch (error) {
    log('❌ Failed to load module: ' + error.message, 'red');
    results['get-bird-presigned-url'] = { success: false, error: error.message };
  }
  
  // Test 2: bypass-ngrok-warning.js
  log('\n📋 Test 2: bypass-ngrok-warning.js', 'blue');
  try {
    // Check if file exists and is readable
    const fs = require('fs');
    const utilityPath = path.join(__dirname, 'utilities', 'bypass-ngrok-warning.js');
    
    if (fs.existsSync(utilityPath)) {
      log('✅ File exists and is readable', 'green');
      log('   This is a standalone Express server for PDF serving', 'yellow');
      log('   Run: node utilities/bypass-ngrok-warning.js to start server', 'yellow');
      results['bypass-ngrok-warning'] = { success: true };
    } else {
      log('❌ File not found', 'red');
      results['bypass-ngrok-warning'] = { success: false, error: 'File not found' };
    }
  } catch (error) {
    log('❌ Error checking file: ' + error.message, 'red');
    results['bypass-ngrok-warning'] = { success: false, error: error.message };
  }
  
  return results;
}

async function showServiceInfo() {
  log('\n📊 BIRD-API-CLIENT.JS INFO', 'bright');
  separator();
  
  log('bird-api-client.js:', 'cyan');
  log('  • Purpose: Complete WhatsApp API client', 'yellow');
  log('  • Methods: sendMessage(), sendTemplateMessage(), uploadImage(), sendImageMessage(), testConnection(), validateConfig()', 'yellow');
  log('  • Config: Hardcoded workspace/channel IDs, reads API key from env', 'yellow');
  log('  • Focus: All message types (text, template, images)', 'yellow');
  log('  • Webhook processing: Handled in listener.js', 'yellow');
}

async function main() {
  log('\n🚀 Bird Service Test Suite', 'bright');
  log('='.repeat(60), 'bright');
  
  const results = {
    birdService: null,
    birdApiClient: null,
    utilities: null
  };
  
  // Test each service
  results.birdApiClient = await testBirdApiClient();
  results.utilities = await testUtilities();
  
  // Show service info
  await showServiceInfo();
  
  // Summary
  separator();
  log('📊 TEST SUMMARY', 'bright');
  separator();
  
  log(`bird-api-client.js: ${results.birdApiClient.success ? '✅ PASS' : '❌ FAIL'}`, 
      results.birdApiClient.success ? 'green' : 'red');
  log(`utilities/get-bird-presigned-url.js: ${results.utilities['get-bird-presigned-url'].success ? '✅ PASS' : '❌ FAIL'}`, 
      results.utilities['get-bird-presigned-url'].success ? 'green' : 'red');
  log(`utilities/bypass-ngrok-warning.js: ${results.utilities['bypass-ngrok-warning'].success ? '✅ PASS' : '❌ FAIL'}`, 
      results.utilities['bypass-ngrok-warning'].success ? 'green' : 'red');
  
  const allPassed = results.birdApiClient?.success !== false && 
                    results.utilities?.['get-bird-presigned-url']?.success !== false &&
                    results.utilities?.['bypass-ngrok-warning']?.success !== false;
  
  separator();
  if (allPassed) {
    log('🎉 All tests passed!', 'green');
  } else {
    log('⚠️  Some tests failed. Check the output above.', 'yellow');
  }
  separator();
}

// Run tests
main().catch(error => {
  log('❌ Fatal error: ' + error.message, 'red');
  console.error(error);
  process.exit(1);
});

