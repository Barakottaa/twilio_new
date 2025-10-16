#!/usr/bin/env node

const axios = require('axios');

// Load environment variables
function loadEnv() {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

loadEnv();

// Configuration
const ACCESS_KEY = process.env.BIRD_API_KEY;
const WORKSPACE_ID = process.env.BIRD_WORKSPACE_ID || '2d7a1e03-25e4-401e-bf1e-0ace545673d7';
const CHANNEL_ID = process.env.BIRD_CHANNEL_ID || '8e046034-bca7-5124-89d0-1a64c1cbe819';

if (!ACCESS_KEY) {
  console.error('❌ BIRD_API_KEY not found in environment variables');
  process.exit(1);
}

// Get presigned upload URL from Bird
async function getPresignedUrl(contentType = 'application/pdf') {
  const url = `https://api.bird.com/workspaces/${WORKSPACE_ID}/channels/${CHANNEL_ID}/presigned-upload`;
  
  console.log('🔗 Request URL:', url);
  console.log('📄 Content Type:', contentType);
  console.log('🔑 Authorization:', `AccessKey ${ACCESS_KEY.substring(0, 8)}...`);
  
  const payload = {
    contentType: contentType
  };
  
  console.log('📤 Request Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `AccessKey ${ACCESS_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ Success! Presigned URL Response:');
    console.log('📊 Status:', response.status);
    console.log('📋 Response Data:', JSON.stringify(response.data, null, 2));
    
    return {
      mediaUrl: response.data.mediaUrl,
      uploadUrl: response.data.uploadUrl,
      uploadFormData: response.data.uploadFormData
    };
  } catch (error) {
    console.error('\n❌ Error getting presigned URL:');
    console.error('📊 Status:', error.response?.status);
    console.error('📋 Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('💬 Error Message:', error.message);
    throw error;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    contentType: 'application/pdf'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--content-type=')) {
      config.contentType = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  return config;
}

function showHelp() {
  console.log(`
🚀 Bird Presigned URL Getter

📋 Usage:
   node get-bird-presigned-url.js [options]

📋 What it does:
   Gets a presigned upload URL from Bird API for file uploads
   Shows the complete request/response structure
   Useful for debugging upload issues

📋 Options:
   --content-type=<type>   Content type (default: application/pdf)
   --help, -h              Show this help

📋 Examples:
   # Get presigned URL for PDF
   node get-bird-presigned-url.js
   
   # Get presigned URL for image
   node get-bird-presigned-url.js --content-type=image/jpeg
   
   # Get presigned URL for document
   node get-bird-presigned-url.js --content-type=application/msword
`);
}

// Main function
async function main() {
  console.log('🚀 Bird Presigned URL Getter\n');

  const config = parseArgs();

  console.log('📋 Configuration:');
  console.log(`   🔑 API Key: ${ACCESS_KEY.substring(0, 8)}...`);
  console.log(`   🏢 Workspace ID: ${WORKSPACE_ID}`);
  console.log(`   📱 Channel ID: ${CHANNEL_ID}`);
  console.log(`   📄 Content Type: ${config.contentType}`);

  try {
    const result = await getPresignedUrl(config.contentType);
    
    console.log('\n🎯 Presigned URL Details:');
    console.log(`   📤 Upload URL: ${result.uploadUrl}`);
    console.log(`   🔗 Media URL: ${result.mediaUrl}`);
    console.log(`   📋 Form Data:`, result.uploadFormData);
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Use the uploadUrl to upload your file');
    console.log('   2. Use the mediaUrl in your WhatsApp message');
    console.log('   3. Include the uploadFormData in your upload request');
    
  } catch (error) {
    console.error('\n❌ Failed to get presigned URL:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  getPresignedUrl
};
