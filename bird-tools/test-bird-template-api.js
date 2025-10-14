#!/usr/bin/env node

/**
 * Test script for Bird Template API
 * Tests the template-based message sending endpoint
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      });
    }
  } catch (error) {
    console.log('⚠️ Could not load .env file:', error.message);
  }
}

loadEnv();

// Configuration
const BIRD_API_KEY = process.env.BIRD_API_KEY;
const WORKSPACE_ID = '2d7a1e03-25e4-401e-bf1e-0ace545673d7';
const CHANNEL_ID = '8e046034-bca7-5124-89d0-1a64c1cbe819';
const PROJECT_ID = '4868dec5-c2fc-4b8e-8612-45dbc3a833c6';
const TEMPLATE_VERSION = '1bafdb0a-dfb2-4dc8-8a6d-db3f7a456d8e';

// Test phone number
const TEST_PHONE = '+201016666348';

async function testBirdTemplateAPI() {
  console.log('🕊️ Testing Bird Template API...\n');

  // Validate configuration
  if (!BIRD_API_KEY) {
    console.error('❌ BIRD_API_KEY is not set in environment variables');
    console.log('Please add BIRD_API_KEY to your .env file');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`   Workspace ID: ${WORKSPACE_ID}`);
  console.log(`   Channel ID: ${CHANNEL_ID}`);
  console.log(`   Project ID: ${PROJECT_ID}`);
  console.log(`   Template Version: ${TEMPLATE_VERSION}`);
  console.log(`   Test Phone: ${TEST_PHONE}`);
  console.log(`   API Key: ${BIRD_API_KEY.substring(0, 10)}...`);
  console.log('');

  // Prepare the request payload
  const payload = {
    receiver: {
      contacts: [
        {
          identifierValue: TEST_PHONE,
          identifierKey: "phonenumber"
        }
      ]
    },
    template: {
      projectId: PROJECT_ID,
      version: TEMPLATE_VERSION,
      locale: "en",
      parameters: [
        {
          type: "string",
          key: "patient_name",
          value: "عبدالرحمن"
        },
        {
          type: "string",
          key: "total_cost",
          value: "500"
        },
        {
          type: "string",
          key: "lab_no",
          value: "1"
        }
      ]
    }
  };

  console.log('📤 Request Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');

  try {
    console.log('🚀 Sending request to Bird API...');
    
    const response = await axios.post(
      `https://api.bird.com/workspaces/${WORKSPACE_ID}/channels/${CHANNEL_ID}/messages`,
      payload,
      {
        headers: {
          'Authorization': `AccessKey ${BIRD_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    console.log('✅ Success! Response received:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Status Text: ${response.statusText}`);
    console.log('📄 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    return {
      success: true,
      status: response.status,
      data: response.data
    };

  } catch (error) {
    console.error('❌ Request failed:');
    
    if (error.response) {
      // Server responded with error status
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Status Text: ${error.response.statusText}`);
      console.error('📄 Error Response:');
      console.error(JSON.stringify(error.response.data, null, 2));
      
      return {
        success: false,
        status: error.response.status,
        error: error.response.data
      };
    } else if (error.request) {
      // Request was made but no response received
      console.error('   No response received from server');
      console.error(`   Error: ${error.message}`);
      
      return {
        success: false,
        error: 'No response received'
      };
    } else {
      // Something else happened
      console.error(`   Error: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run the test
if (require.main === module) {
  testBirdTemplateAPI()
    .then(result => {
      console.log('\n🏁 Test completed');
      if (result.success) {
        console.log('✅ Test passed successfully');
        process.exit(0);
      } else {
        console.log('❌ Test failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testBirdTemplateAPI };
