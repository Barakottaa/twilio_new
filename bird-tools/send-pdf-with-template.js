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

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    phone: null,
    folder: 'D:\\Results',
    contentType: 'application/pdf',
    singleFile: null,
    templateFirst: true
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
    } else if (arg === '--no-template') {
      config.templateFirst = false;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  return config;
}

function showHelp() {
  console.log(`
🚀 Bird PDF Sender with Template (24-hour window)

📋 Usage:
   node send-pdf-with-template.js --phone=+1234567890 [options]

📋 Options:
   --phone=<number>        Phone number to send to (required)
   --folder=<path>         Folder containing PDFs (default: D:\\Results)
   --file=<path>           Send single PDF file instead of folder
   --content-type=<type>   Content type (default: application/pdf)
   --no-template           Skip template message (direct send only)
   --help, -h              Show this help

📋 How it works:
   1. Sends a template message first (opens 24-hour window)
   2. Then sends your custom PDF as a regular message
   3. This ensures delivery within WhatsApp's rules

📋 Examples:
   # Send PDF with template (recommended)
   node send-pdf-with-template.js --phone=+201557000970 --file="D:\\Results\\report.pdf"
   
   # Send all PDFs from folder
   node send-pdf-with-template.js --phone=+201557000970
   
   # Direct send only (might not work outside 24h window)
   node send-pdf-with-template.js --phone=+201557000970 --file="D:\\Results\\report.pdf" --no-template
`);
}

// Send template message first (opens 24-hour window)
async function sendTemplateMessage(phone) {
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

// Get presigned upload URL
async function getPresignedUrl(contentType) {
  const url = `https://api.bird.com/workspaces/${WORKSPACE_ID}/channels/${CHANNEL_ID}/presigned-upload`;
  
  try {
    const response = await axios.post(url, {
      contentType: contentType
    }, {
      headers: {
        'Authorization': `AccessKey ${ACCESS_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    return {
      mediaUrl: response.data.mediaUrl,
      uploadUrl: response.data.uploadUrl,
      uploadFormData: response.data.uploadFormData
    };
  } catch (error) {
    throw new Error(`Presigned URL failed: ${error.response?.data?.message || error.message}`);
  }
}

// Upload file to S3
async function uploadToS3(filePath, uploadUrl, uploadFormData, contentType) {
  const formData = new FormData();
  
  // Add form fields
  Object.entries(uploadFormData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  // Add file
  const fileStream = fs.createReadStream(filePath);
  const fileName = path.basename(filePath);
  formData.append('file', fileStream, {
    filename: fileName,
    contentType: contentType
  });

  try {
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 60000
    });

    return response.data;
  } catch (error) {
    throw new Error(`S3 upload failed: ${error.response?.data?.message || error.message}`);
  }
}

// Send direct message with custom PDF
async function sendDirectMessageWithCustomPDF(phone, mediaUrl, fileName, contentType) {
  const url = `https://api.bird.com/workspaces/${WORKSPACE_ID}/channels/${CHANNEL_ID}/messages`;
  
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
        text: "نتائج التحاليل خلصت وبعتنهالك هنا لو في اي استفسار عندك ممكن تكلمنا علي رقم الواتساب المخصص للاستفسارات والشكاوي.\nhttps://wa.me/201557000970",
        files: [{
          mediaUrl: mediaUrl,
          filename: fileName,
          contentType: contentType
        }]
      }
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
    throw new Error(`Direct message send failed: ${error.response?.data?.message || error.message}`);
  }
}

// Process single file
async function processFile(filePath, phone, contentType, sendTemplateFirst) {
  const fileName = path.basename(filePath);
  console.log(`\n=== Processing ${fileName} ===`);

  try {
    // Step 1: Send template message first (if requested)
    if (sendTemplateFirst) {
      console.log('📤 Sending template message first (opens 24-hour window)...');
      const templateResult = await sendTemplateMessage(phone);
      console.log(`✅ Template sent: ${templateResult.id} (${templateResult.status})`);
      console.log('⏱️  Waiting 2 seconds before sending PDF...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Step 2: Get presigned URL
    console.log('📤 Getting presigned upload URL...');
    const { mediaUrl, uploadUrl, uploadFormData } = await getPresignedUrl(contentType);
    console.log('✅ Presigned URL obtained');

    // Step 3: Upload to S3
    console.log('📤 Uploading to S3...');
    await uploadToS3(filePath, uploadUrl, uploadFormData, contentType);
    console.log('✅ S3 upload successful');

    // Step 4: Send direct message with custom PDF
    console.log('📤 Sending direct message with custom PDF...');
    const result = await sendDirectMessageWithCustomPDF(phone, mediaUrl, fileName, contentType);
    console.log(`✅ PDF message sent: ${fileName}`);
    console.log(`   📨 Message ID: ${result.id}`);
    console.log(`   📊 Status: ${result.status}`);

    return result;
  } catch (error) {
    console.error(`❌ Failed to process ${fileName}: ${error.message}`);
    return null;
  }
}

// Main function
async function main() {
  console.log('🚀 Bird PDF Sender with Template (24-hour window)\n');

  const config = parseArgs();

  if (!config.phone) {
    console.error('❌ Phone number is required. Use --phone=<number>');
    console.log('\n💡 Use --help for usage information');
    process.exit(1);
  }

  console.log(`📱 Phone: ${config.phone}`);
  console.log(`📁 Folder: ${config.folder}`);
  console.log(`📄 Content Type: ${config.contentType}`);
  console.log(`📋 Template First: ${config.templateFirst ? 'Yes (recommended)' : 'No (direct send)'}`);

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
    const result = await processFile(filePath, config.phone, config.contentType, config.templateFirst);
    if (result) {
      results.push(result);
    }
  }

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully sent: ${results.length}/${files.length} files`);
  
  if (results.length > 0) {
    console.log(`   📨 Message IDs:`);
    results.forEach((result, index) => {
      console.log(`      ${index + 1}. ${result.id} (${result.status})`);
    });
  }

  if (config.templateFirst) {
    console.log(`\n💡 Template was sent first to open 24-hour window for reliable delivery`);
  } else {
    console.log(`\n⚠️  Direct send only - may not work outside 24-hour window`);
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
  sendTemplateMessage,
  getPresignedUrl,
  uploadToS3,
  sendDirectMessageWithCustomPDF,
  processFile
};
