#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load environment variables
function loadEnv() {
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

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    phone: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--phone=')) {
      config.phone = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  return config;
}

function showHelp() {
  console.log(`
🚀 Bird PDF Template Sender (Simple)

📋 Usage:
   node send-pdf-template-simple.js --phone=+1234567890

📋 What it does:
   Sends the PDF template with the embedded PDF file (no custom file upload needed)
   This is the most reliable method - uses the pre-configured template

📋 Examples:
   # Send PDF template
   node send-pdf-template-simple.js --phone=+201557000970
`);
}

// Send PDF template (with embedded PDF file)
async function sendPDFTemplate(phone) {
  const url = `https://api.bird.com/workspaces/${WORKSPACE_ID}/channels/${CHANNEL_ID}/messages`;
  
  const payload = {
    receiver: {
      contacts: [{
        identifierKey: "phonenumber",
        identifierValue: phone
      }]
    },
    template: {
      projectId: "1c05f3a5-c35a-404f-9ac8-7af994fbeab1",
      version: "8204340b-2e66-450c-b0ea-be89d5a24235",
      locale: "ar"
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `AccessKey ${ACCESS_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    throw new Error(`Template send failed: ${error.response?.data?.message || error.message}`);
  }
}

// Main function
async function main() {
  console.log('🚀 Bird PDF Template Sender (Simple)\n');

  const config = parseArgs();

  if (!config.phone) {
    console.error('❌ Phone number is required. Use --phone=<number>');
    console.log('\n💡 Use --help for usage information');
    process.exit(1);
  }

  console.log(`📱 Phone: ${config.phone}`);
  console.log(`📋 Template: PDF template with embedded file`);

  try {
    console.log('\n📤 Sending PDF template...');
    const result = await sendPDFTemplate(config.phone);
    
    console.log('✅ Template sent successfully!');
    console.log(`   📨 Message ID: ${result.id}`);
    console.log(`   📊 Status: ${result.status}`);
    console.log(`   📄 File: Embedded PDF from template`);
    console.log(`   📝 Text: Arabic message with WhatsApp link`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
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
  sendPDFTemplate
};
