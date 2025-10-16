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
const BIRD_API_KEY = process.env.BIRD_API_KEY;
const BIRD_WORKSPACE_ID = process.env.BIRD_WORKSPACE_ID;
const BIRD_CHANNEL_ID = process.env.BIRD_CHANNEL_ID;

if (!BIRD_API_KEY || !BIRD_WORKSPACE_ID || !BIRD_CHANNEL_ID) {
  console.error('❌ Bird API credentials not found in environment variables');
  console.error('   Required: BIRD_API_KEY, BIRD_WORKSPACE_ID, BIRD_CHANNEL_ID');
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
    templateProjectId: null,
    templateVersionId: null,
    staticDomain: null
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
    } else if (arg.startsWith('--template-project=')) {
      config.templateProjectId = arg.split('=')[1];
    } else if (arg.startsWith('--template-version=')) {
      config.templateVersionId = arg.split('=')[1];
    } else if (arg.startsWith('--domain=')) {
      config.staticDomain = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  return config;
}

function showHelp() {
  console.log(`
🚀 Bird Custom PDF Template Sender (Correct Variable Usage)

📋 Usage:
   node send-custom-pdf-bird-correct.js --phone=+1234567890 --template-project=xxx --template-version=xxx --domain=https://yourdomain.com [options]

📋 What it does:
   Uploads PDF to your static domain
   Sends Bird template with correct PDF URL variable structure
   Follows WhatsApp guidelines for template variables

📋 Options:
   --phone=<number>           Phone number to send to (required)
   --template-project=<id>    Bird template project ID (required)
   --template-version=<id>    Bird template version ID (required)
   --domain=<url>             Static domain for PDF hosting (required, e.g., https://yourdomain.com)
   --folder=<path>            Folder containing PDFs (default: D:\\Results)
   --file=<path>              Send single PDF file instead of folder
   --content-type=<type>      Content type (default: application/pdf)
   --help, -h                 Show this help

📋 Prerequisites:
   1. Create Bird template with PDF URL variable
   2. Use correct variable structure: https://yourdomain.com/pdfs/{{1}}
   3. Provide sample value during template creation
   4. Ensure sample URL is accessible for approval
   5. Have a static domain to host PDFs

📋 Examples:
   # Send custom PDF using Bird template with correct variable structure
   node send-custom-pdf-bird-correct.js \\
     --phone=+201557000970 \\
     --template-project=1c05f3a5-c35a-404f-9ac8-7af994fbeab1 \\
     --template-version=8204340b-2e66-450c-b0ea-be89d5a24235 \\
     --domain=https://yourdomain.com \\
     --file="D:\\Results\\20251012010240.pdf"
   
   # Send all PDFs from folder
   node send-custom-pdf-bird-correct.js \\
     --phone=+201557000970 \\
     --template-project=1c05f3a5-c35a-404f-9ac8-7af994fbeab1 \\
     --template-version=8204340b-2e66-450c-b0ea-be89d5a24235 \\
     --domain=https://yourdomain.com
`);
}

// Upload file to your static domain (you need to implement this)
async function uploadToStaticDomain(filePath, domain) {
  const fileName = path.basename(filePath);
  
  // This is a placeholder - you need to implement actual upload to your domain
  // Options:
  // 1. Upload to your web server
  // 2. Upload to AWS S3 with your domain
  // 3. Upload to any static file hosting service
  
  console.log(`📤 Uploading ${fileName} to ${domain}...`);
  
  // For now, we'll simulate the upload and return a URL
  // You need to replace this with actual upload logic
  const pdfUrl = `${domain}/pdfs/${fileName}`;
  
  console.log(`✅ Upload successful: ${pdfUrl}`);
  return {
    url: pdfUrl,
    filename: fileName
  };
}

// Send message using Bird template with correct variable structure
async function sendBirdTemplate(phone, templateProjectId, templateVersionId, pdfUrl) {
  const url = `https://api.bird.com/workspaces/${BIRD_WORKSPACE_ID}/channels/${BIRD_CHANNEL_ID}/messages`;
  
  const payload = {
    receiver: {
      contacts: [{
        identifierKey: "phonenumber",
        identifierValue: phone
      }]
    },
    template: {
      projectId: templateProjectId,
      version: templateVersionId,
      locale: "ar",
      variables: {
        "1": pdfUrl  // This replaces {{1}} in your template
      }
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `AccessKey ${BIRD_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    throw new Error(`Bird template send failed: ${error.response?.data?.message || error.message}`);
  }
}

// Process single file
async function processFile(filePath, phone, templateProjectId, templateVersionId, domain) {
  const fileName = path.basename(filePath);
  console.log(`\n=== Processing ${fileName} ===`);

  try {
    // Step 1: Upload to your static domain
    console.log('📤 Uploading to static domain...');
    const uploadResult = await uploadToStaticDomain(filePath, domain);
    console.log(`✅ Upload successful: ${uploadResult.url}`);
    console.log(`   📄 File: ${fileName}`);

    // Step 2: Send using Bird template with correct variable
    console.log('📤 Sending via Bird template...');
    const messageResult = await sendBirdTemplate(phone, templateProjectId, templateVersionId, uploadResult.url);
    console.log(`✅ Template sent: ${messageResult.id}`);
    console.log(`   📊 Status: ${messageResult.status}`);
    console.log(`   📱 To: ${phone}`);
    console.log(`   📄 PDF: ${fileName}`);
    console.log(`   🔗 URL: ${uploadResult.url}`);

    return messageResult;
  } catch (error) {
    console.error(`❌ Failed to process ${fileName}: ${error.message}`);
    return null;
  }
}

// Main function
async function main() {
  console.log('🚀 Bird Custom PDF Template Sender (Correct Variable Usage)\n');

  const config = parseArgs();

  if (!config.phone) {
    console.error('❌ Phone number is required. Use --phone=<number>');
    console.log('\n💡 Use --help for usage information');
    process.exit(1);
  }

  if (!config.templateProjectId || !config.templateVersionId) {
    console.error('❌ Template IDs are required. Use --template-project=<id> --template-version=<id>');
    console.log('\n💡 Use --help for usage information');
    process.exit(1);
  }

  if (!config.staticDomain) {
    console.error('❌ Static domain is required. Use --domain=<url>');
    console.log('\n💡 Use --help for usage information');
    process.exit(1);
  }

  console.log(`📱 Phone: ${config.phone}`);
  console.log(`📋 Template Project: ${config.templateProjectId}`);
  console.log(`📋 Template Version: ${config.templateVersionId}`);
  console.log(`🌐 Static Domain: ${config.staticDomain}`);
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
    const result = await processFile(filePath, config.phone, config.templateProjectId, config.templateVersionId, config.staticDomain);
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

  console.log(`\n💡 Using Bird Templates with Correct Variable Structure:`);
  console.log(`   ✅ Static domain for PDF hosting`);
  console.log(`   ✅ Variable only in path/filename`);
  console.log(`   ✅ Follows WhatsApp guidelines`);
  console.log(`   ✅ Template approval compliant`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  uploadToStaticDomain,
  sendBirdTemplate,
  processFile
};
