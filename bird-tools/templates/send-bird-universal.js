#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Load template configs
function loadTemplateConfigs() {
  const configPath = path.join(__dirname, 'template-configs.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  return {};
}

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
const TEMPLATE_CONFIGS = loadTemplateConfigs();

if (!ACCESS_KEY) {
  console.error('❌ BIRD_API_KEY not found in environment variables');
  process.exit(1);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    templateType: null,
    phone: null,
    folder: 'D:\\Results',
    contentType: 'application/pdf',
    singleFile: null,
    parameters: {}
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
    } else if (arg.startsWith('--')) {
      const key = arg.substring(2).split('=')[0];
      const value = arg.split('=')[1] || '';
      config.parameters[key] = value;
    } else if (!config.templateType) {
      config.templateType = arg;
    }
  }

  return config;
}

function showHelp() {
  console.log(`
🚀 Universal Bird Sender

📋 Usage:
   node send-bird-universal.js <template-type> --phone=+1234567890 [options]

📋 Template Types:
   # Regular templates
   new_invoice_remaining    - Invoice with 4 parameters (Arabic)
   Invoice_0_reamaining     - Invoice with 3 parameters (English)
   2nd_installment          - Simple installment (1 parameter)
   
   # Media templates
   result_pdf               - Send PDF files as media

📋 Options:
   --phone=<number>         Phone number to send to (required)
   --folder=<path>          Folder containing PDFs (for media templates)
   --file=<path>            Send single PDF file (for media templates)
   --content-type=<type>    Content type (default: application/pdf)
   --<param>=<value>        Template parameters (e.g., --name="عبدالرحمن")
   --help, -h               Show this help

📋 Examples:
   # Send template
   node send-bird-universal.js new_invoice_remaining --phone=+201016666348 --paid=400 --remaining=100 --name="محمد" --lab=51
   
   # Send PDF media
   node send-bird-universal.js result_pdf --phone=+201016666348 --folder=D:\\Results
   
   # Send single PDF
   node send-bird-universal.js result_pdf --phone=+201016666348 --file=report.pdf
`);
}

// Send template message
async function sendTemplate(templateType, phone, parameters) {
  const templateConfig = TEMPLATE_CONFIGS[templateType];
  if (!templateConfig) {
    throw new Error(`Template '${templateType}' not found`);
  }

  if (templateConfig.type === 'media') {
    throw new Error(`Template '${templateType}' is a media template. Use --folder or --file option.`);
  }

  // Build variables object
  const variables = {};
  templateConfig.parameters.forEach(paramName => {
    const value = parameters[paramName] || templateConfig.defaults[paramName] || 'غير محدد';
    variables[paramName] = value;
  });

  const payload = {
    receiver: {
      contacts: [{
        identifierValue: phone,
        identifierKey: "phonenumber"
      }]
    },
    template: {
      projectId: templateConfig.projectId,
      version: templateConfig.version,
      locale: templateConfig.locale || 'ar',
      variables: variables
    }
  };

  const url = `https://api.bird.com/workspaces/${WORKSPACE_ID}/channels/${CHANNEL_ID}/messages`;

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `AccessKey ${ACCESS_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    throw new Error(`Template send failed: ${error.response?.data?.message || error.message}`);
  }
}

// Send media (PDF) message
async function sendMedia(phone, folder, singleFile, contentType) {
  let files = [];

  if (singleFile) {
    const filePath = path.resolve(singleFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    files = [filePath];
  } else {
    if (!fs.existsSync(folder)) {
      throw new Error(`Folder not found: ${folder}`);
    }

    const folderFiles = fs.readdirSync(folder)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => path.join(folder, file));

    if (folderFiles.length === 0) {
      throw new Error(`No PDF files found in ${folder}`);
    }

    files = folderFiles;
  }

  const results = [];
  for (const filePath of files) {
    const result = await processMediaFile(filePath, phone, contentType);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

// Process single media file
async function processMediaFile(filePath, phone, contentType) {
  const fileName = path.basename(filePath);
  console.log(`\n=== Processing ${fileName} ===`);

  try {
    // Step 1: Get presigned URL
    console.log('📤 Getting presigned upload URL...');
    const { mediaUrl, uploadUrl, uploadFormData } = await getPresignedUrl(contentType);
    console.log('✅ Presigned URL obtained');

    // Step 2: Upload to S3
    console.log('📤 Uploading to S3...');
    await uploadToS3(filePath, uploadUrl, uploadFormData, contentType);
    console.log('✅ S3 upload successful');

    // Step 3: Send WhatsApp message
    console.log('📤 Sending WhatsApp message...');
    const result = await sendWhatsAppMessage(phone, mediaUrl, fileName, contentType);
    console.log(`✅ WhatsApp sent: ${fileName}`);
    console.log(`   📨 Message ID: ${result.id}`);
    console.log(`   📊 Status: ${result.status}`);

    return result;
  } catch (error) {
    console.error(`❌ Failed to process ${fileName}: ${error.message}`);
    return null;
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

// Send WhatsApp message with media
async function sendWhatsAppMessage(phone, mediaUrl, fileName, contentType) {
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
        text: "Your lab report from Baraka Lab",
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
    throw new Error(`WhatsApp send failed: ${error.response?.data?.message || error.message}`);
  }
}

// Main function
async function main() {
  console.log('🚀 Universal Bird Sender\n');

  const config = parseArgs();

  if (!config.templateType || config.templateType === 'help' || process.argv.includes('--help')) {
    showHelp();
    return;
  }

  if (!config.phone) {
    console.error('❌ Phone number is required. Use --phone=<number>');
    console.log('\n💡 Use --help for usage information');
    process.exit(1);
  }

  console.log(`📋 Template Type: ${config.templateType}`);
  console.log(`📱 Phone: ${config.phone}`);

  try {
    const templateConfig = TEMPLATE_CONFIGS[config.templateType];
    if (!templateConfig) {
      console.error(`❌ Unknown template type: ${config.templateType}`);
      console.log('\n📋 Available template types:');
      Object.keys(TEMPLATE_CONFIGS).forEach(type => {
        console.log(`   - ${type}`);
      });
      return;
    }

    if (templateConfig.type === 'media') {
      // Media template
      console.log(`📁 Folder: ${config.folder}`);
      console.log(`📄 Content Type: ${config.contentType}`);
      
      const results = await sendMedia(config.phone, config.folder, config.singleFile, config.contentType);
      
      console.log(`\n📊 Summary:`);
      console.log(`   ✅ Successfully sent: ${results.length} file(s)`);
      
      if (results.length > 0) {
        console.log(`   📨 Message IDs:`);
        results.forEach((result, index) => {
          console.log(`      ${index + 1}. ${result.id} (${result.status})`);
        });
      }
    } else {
      // Regular template
      console.log(`📋 ${templateConfig.name}`);
      console.log(`   🆔 Project ID: ${templateConfig.projectId}`);
      console.log(`   📝 Version: ${templateConfig.version}`);
      console.log(`   📊 Expected Parameters: ${templateConfig.parameters.join(', ')}`);
      console.log('');

      // Build variables
      const variables = {};
      templateConfig.parameters.forEach(paramName => {
        const value = config.parameters[paramName] || templateConfig.defaults[paramName] || 'غير محدد';
        variables[paramName] = value;
      });

      console.log('📤 Final Variables:');
      Object.entries(variables).forEach(([key, value], index) => {
        console.log(`   ${index + 1}. ${key}: ${value}`);
      });
      console.log('');

      const result = await sendTemplate(config.templateType, config.phone, config.parameters);
      
      console.log('✅ Template sent successfully!');
      console.log(`   📨 Message ID: ${result.id}`);
      console.log(`   📊 Status: ${result.status}`);
      
      if (result.body?.text?.actions) {
        console.log(`🔘 Buttons available: ${result.body.text.actions.map(a => a.postback.text).join(', ')}`);
      }
    }

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
  sendTemplate,
  sendMedia,
  processMediaFile
};
