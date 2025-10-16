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
const ACCESS_KEY = process.env.BIRD_API_KEY;
const WORKSPACE_ID = process.env.BIRD_WORKSPACE_ID || '2d7a1e03-25e4-401e-bf1e-0ace545673d7';
const CHANNEL_ID = process.env.BIRD_CHANNEL_ID || '8e046034-bca7-5124-89d0-1a64c1cbe819';

if (!ACCESS_KEY) {
  console.error('❌ BIRD_API_KEY not found in environment variables');
  process.exit(1);
}

// Step 1: Get presigned upload URL from Bird
async function getPresignedUrl(contentType = 'application/pdf') {
  const url = `https://api.bird.com/workspaces/${WORKSPACE_ID}/channels/${CHANNEL_ID}/presigned-upload`;
  
  console.log('📤 Step 1: Getting presigned URL from Bird...');
  console.log('🔗 URL:', url);
  
  const payload = {
    contentType: contentType
  };
  
  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `AccessKey ${ACCESS_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Presigned URL obtained successfully!');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
    return {
      mediaUrl: response.data.mediaUrl,
      uploadUrl: response.data.uploadUrl,
      uploadFormData: response.data.uploadFormData
    };
  } catch (error) {
    console.error('❌ Failed to get presigned URL:', error.response?.data || error.message);
    throw error;
  }
}

// Step 2: Upload file using presigned URL
async function uploadFileWithPresignedUrl(filePath, uploadUrl, uploadFormData, contentType) {
  const fileName = path.basename(filePath);
  
  console.log('\n📤 Step 2: Uploading file to S3...');
  console.log('📄 File:', fileName);
  console.log('🔗 Upload URL:', uploadUrl);
  console.log('📋 Form Data:', uploadFormData);
  
  const formData = new FormData();
  
  // Add all form fields from Bird's response
  Object.entries(uploadFormData).forEach(([key, value]) => {
    console.log(`   📝 Adding form field: ${key} = ${value}`);
    formData.append(key, value);
  });
  
  // Add the file
  const fileStream = fs.createReadStream(filePath);
  formData.append('file', fileStream, {
    filename: fileName,
    contentType: contentType
  });
  
  console.log(`   📎 Adding file: ${fileName} (${contentType})`);
  
  try {
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 60000 // 60 seconds timeout for file upload
    });

    console.log('✅ File uploaded successfully!');
    console.log('📊 Upload Response Status:', response.status);
    console.log('📋 Upload Response Data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ File upload failed:', error.response?.data || error.message);
    throw error;
  }
}

// Step 3: Send WhatsApp message with uploaded media
async function sendWhatsAppMessage(phone, mediaUrl, fileName, contentType) {
  const url = `https://api.bird.com/workspaces/${WORKSPACE_ID}/channels/${CHANNEL_ID}/messages`;
  
  console.log('\n📤 Step 3: Sending WhatsApp message...');
  console.log('📱 Phone:', phone);
  console.log('🔗 Media URL:', mediaUrl);
  
  const payload = {
    receiver: {
      contacts: [{
        identifierKey: "phonenumber",
        identifierValue: phone
      }]
    },
    body: {
      type: "file",
      file: {
        text: "Your lab report from Baraka Lab",
        files: [{
          mediaUrl: mediaUrl,
          filename: fileName,
          contentType: contentType
        }]
      }
    }
  };
  
  console.log('📋 Message Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `AccessKey ${ACCESS_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ WhatsApp message sent successfully!');
    console.log('📨 Message ID:', response.data.id);
    console.log('📊 Status:', response.data.status);
    console.log('📋 Full Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ WhatsApp message failed:', error.response?.data || error.message);
    throw error;
  }
}

// Complete workflow: Get presigned URL, upload file, send message
async function completeWorkflow(filePath, phone, contentType = 'application/pdf') {
  const fileName = path.basename(filePath);
  
  console.log('🚀 Complete Bird Upload Workflow\n');
  console.log('📋 Configuration:');
  console.log(`   📄 File: ${fileName}`);
  console.log(`   📱 Phone: ${phone}`);
  console.log(`   📄 Content Type: ${contentType}`);
  console.log(`   🔑 API Key: ${ACCESS_KEY.substring(0, 8)}...`);
  console.log(`   🏢 Workspace: ${WORKSPACE_ID}`);
  console.log(`   📱 Channel: ${CHANNEL_ID}`);

  try {
    // Step 1: Get presigned URL
    const { mediaUrl, uploadUrl, uploadFormData } = await getPresignedUrl(contentType);
    
    // Step 2: Upload file
    await uploadFileWithPresignedUrl(filePath, uploadUrl, uploadFormData, contentType);
    
    // Step 3: Send WhatsApp message
    const result = await sendWhatsAppMessage(phone, mediaUrl, fileName, contentType);
    
    console.log('\n🎉 Complete workflow successful!');
    console.log(`   📨 Message ID: ${result.id}`);
    console.log(`   📊 Status: ${result.status}`);
    console.log(`   📄 File: ${fileName}`);
    console.log(`   🔗 Media URL: ${mediaUrl}`);
    
    return result;
  } catch (error) {
    console.error('\n❌ Workflow failed:', error.message);
    throw error;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    file: null,
    phone: null,
    contentType: 'application/pdf',
    step: 'complete' // 'presigned', 'upload', 'message', or 'complete'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--file=')) {
      config.file = arg.split('=')[1];
    } else if (arg.startsWith('--phone=')) {
      config.phone = arg.split('=')[1];
    } else if (arg.startsWith('--content-type=')) {
      config.contentType = arg.split('=')[1];
    } else if (arg.startsWith('--step=')) {
      config.step = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  return config;
}

function showHelp() {
  console.log(`
🚀 Bird Upload with Presigned URL

📋 Usage:
   node upload-with-presigned-url.js --file=<path> --phone=<number> [options]

📋 What it does:
   Complete workflow for uploading files via Bird's presigned URL system
   Shows detailed step-by-step process
   Useful for understanding how Bird's upload system works

📋 Options:
   --file=<path>            File to upload (required)
   --phone=<number>         Phone number to send to (required)
   --content-type=<type>    Content type (default: application/pdf)
   --step=<step>            Run specific step: presigned, upload, message, complete (default: complete)
   --help, -h               Show this help

📋 Examples:
   # Complete workflow
   node upload-with-presigned-url.js --file="D:\\Results\\report.pdf" --phone=+201557000970
   
   # Just get presigned URL
   node upload-with-presigned-url.js --step=presigned
   
   # Upload specific file type
   node upload-with-presigned-url.js --file="image.jpg" --phone=+201557000970 --content-type=image/jpeg
`);
}

// Main function
async function main() {
  const config = parseArgs();

  if (config.step === 'presigned') {
    // Just get presigned URL
    await getPresignedUrl(config.contentType);
  } else if (config.step === 'complete') {
    // Complete workflow
    if (!config.file || !config.phone) {
      console.error('❌ Both --file and --phone are required for complete workflow');
      console.log('\n💡 Use --help for usage information');
      process.exit(1);
    }
    
    const filePath = path.resolve(config.file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }
    
    await completeWorkflow(filePath, config.phone, config.contentType);
  } else {
    console.error('❌ Invalid step. Use: presigned, upload, message, or complete');
    console.log('\n💡 Use --help for usage information');
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
  getPresignedUrl,
  uploadFileWithPresignedUrl,
  sendWhatsAppMessage,
  completeWorkflow
};
