#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

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
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
  console.error('❌ Twilio credentials not found in environment variables');
  console.error('   Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER');
  process.exit(1);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    phone: null,
    folder: 'D:\\Results',
    contentType: 'application/pdf',
    singleFile: null,
    templateSid: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--phone=')) {
      config.phone = arg.split('=')[1];
    } else if (arg.startsWith('--folder=')) {
      config.folder = arg.split('=')[1];
    } else if (arg.startsWith('--content-type=')) {
      config.contentType = arg.split('=')[1];
    } else if (arg.startsWith('--file=')) {
      config.singleFile = arg.split('=')[1];
    } else if (arg.startsWith('--template=')) {
      config.templateSid = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  return config;
}

function showHelp() {
  console.log(`
🚀 Twilio Custom PDF Template Sender

📋 Usage:
   node send-custom-pdf-twilio-template.js --phone=+1234567890 --template=HX... [options]

📋 What it does:
   Uses Twilio's Content Template system to send custom PDFs
   No 24-hour window issues - templates work anytime
   Supports dynamic PDF URLs in templates

📋 Options:
   --phone=<number>        Phone number to send to (required)
   --template=<sid>        Twilio Content Template SID (required, starts with HX...)
   --folder=<path>         Folder containing PDFs (default: D:\\Results)
   --file=<path>           Send single PDF file instead of folder
   --content-type=<type>   Content type (default: application/pdf)
   --help, -h              Show this help

📋 Prerequisites:
   1. Create a WhatsApp Content Template in Twilio Console
   2. Include a variable for PDF URL (e.g., {{1}})
   3. Submit template for WhatsApp approval
   4. Get the template SID (starts with HX...)

📋 Examples:
   # Send custom PDF using Twilio template
   node send-custom-pdf-twilio-template.js --phone=+201557000970 --template=HX1234567890abcdef --file="D:\\Results\\report.pdf"
   
   # Send all PDFs from folder
   node send-custom-pdf-twilio-template.js --phone=+201557000970 --template=HX1234567890abcdef
`);
}

// Upload file to Twilio Assets (public URL)
async function uploadToTwilioAssets(filePath) {
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  
  const formData = new FormData();
  formData.append('FriendlyName', fileName);
  formData.append('Content', fileBuffer, {
    filename: fileName,
    contentType: 'application/pdf'
  });

  try {
    const response = await axios.post(
      `https://content.twilio.com/v1/Content`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`
        }
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(`Twilio Assets upload failed: ${error.response?.data?.message || error.message}`);
  }
}

// Send message using Twilio Content Template
async function sendTwilioTemplate(phone, templateSid, pdfUrl) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const formData = new FormData();
  formData.append('To', `whatsapp:${phone}`);
  formData.append('From', TWILIO_WHATSAPP_NUMBER);
  formData.append('ContentSid', templateSid);
  formData.append('ContentVariables', JSON.stringify({
    '1': pdfUrl  // Assuming the template uses {{1}} for PDF URL
  }));

  try {
    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`
      }
    });

    return response.data;
  } catch (error) {
    throw new Error(`Twilio template send failed: ${error.response?.data?.message || error.message}`);
  }
}

// Process single file
async function processFile(filePath, phone, templateSid) {
  const fileName = path.basename(filePath);
  console.log(`\n=== Processing ${fileName} ===`);

  try {
    // Step 1: Upload to Twilio Assets
    console.log('📤 Uploading to Twilio Assets...');
    const assetResult = await uploadToTwilioAssets(filePath);
    console.log(`✅ Upload successful: ${assetResult.sid}`);
    console.log(`   📄 File: ${fileName}`);
    console.log(`   🔗 URL: ${assetResult.url}`);

    // Step 2: Send using Twilio Content Template
    console.log('📤 Sending via Twilio Content Template...');
    const messageResult = await sendTwilioTemplate(phone, templateSid, assetResult.url);
    console.log(`✅ Template sent: ${messageResult.sid}`);
    console.log(`   📊 Status: ${messageResult.status}`);
    console.log(`   📱 To: ${messageResult.to}`);
    console.log(`   📄 PDF: ${fileName}`);

    return messageResult;
  } catch (error) {
    console.error(`❌ Failed to process ${fileName}: ${error.message}`);
    return null;
  }
}

// Main function
async function main() {
  console.log('🚀 Twilio Custom PDF Template Sender\n');

  const config = parseArgs();

  if (!config.phone) {
    console.error('❌ Phone number is required. Use --phone=<number>');
    console.log('\n💡 Use --help for usage information');
    process.exit(1);
  }

  if (!config.templateSid) {
    console.error('❌ Template SID is required. Use --template=HX...');
    console.log('\n💡 Use --help for usage information');
    process.exit(1);
  }

  console.log(`📱 Phone: ${config.phone}`);
  console.log(`📋 Template SID: ${config.templateSid}`);
  console.log(`📁 Folder: ${config.folder}`);

  let files = [];

  if (config.singleFile) {
    // Single file mode
    const filePath = path.resolve(config.singleFile);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }
    files = [filePath];
  } else {
    // Folder mode
    if (!fs.existsSync(config.folder)) {
      console.error(`❌ Folder not found: ${config.folder}`);
      process.exit(1);
    }

    const folderFiles = fs.readdirSync(config.folder)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => path.join(config.folder, file));

    if (folderFiles.length === 0) {
      console.log(`⚠️  No PDF files found in ${config.folder}`);
      return;
    }

    files = folderFiles;
  }

  console.log(`\n📋 Found ${files.length} file(s) to process`);

  // Process each file
  const results = [];
  for (const filePath of files) {
    const result = await processFile(filePath, config.phone, config.templateSid);
    if (result) {
      results.push(result);
    }
  }

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully sent: ${results.length}/${files.length} files`);
  
  if (results.length > 0) {
    console.log(`   📨 Message SIDs:`);
    results.forEach((result, index) => {
      console.log(`      ${index + 1}. ${result.sid} (${result.status})`);
    });
  }

  console.log(`\n💡 Using Twilio Content Templates:`);
  console.log(`   ✅ No 24-hour window issues`);
  console.log(`   ✅ Templates work anytime`);
  console.log(`   ✅ Dynamic PDF URLs supported`);
  console.log(`   ✅ Professional template format`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  uploadToTwilioAssets,
  sendTwilioTemplate,
  processFile
};
