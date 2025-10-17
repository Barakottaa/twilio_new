#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '..', '..', '.env.local');
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

// Get current ngrok URL
async function getNgrokUrl() {
  try {
    const response = await axios.get('http://localhost:4040/api/tunnels');
    const tunnels = response.data.tunnels;
    
    if (tunnels.length > 0) {
      return tunnels[0].public_url;
    } else {
      throw new Error('No active ngrok tunnels found');
    }
  } catch (error) {
    throw new Error(`Failed to get ngrok URL: ${error.message}`);
  }
}

// Get presigned upload URL from Bird
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

// Upload PDF to Bird's media API and get presigned URL
async function uploadPdfToBird(pdfPath) {
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }
  
  const fileName = path.basename(pdfPath);
  const contentType = 'application/pdf';
  
  console.log('📤 Getting presigned upload URL from Bird...');
  
  // Get presigned URL
  const { mediaUrl, uploadUrl, uploadFormData } = await getPresignedUrl(contentType);
  
  console.log('📋 Uploading PDF to Bird media API...');
  console.log(`📄 File: ${fileName}`);
  console.log(`📊 Content Type: ${contentType}`);
  
  // Upload to S3
  const FormData = require('form-data');
  const formData = new FormData();
  
  // Add form fields
  Object.entries(uploadFormData).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  // Add file
  const fileStream = fs.createReadStream(pdfPath);
  formData.append('file', fileStream, {
    filename: fileName,
    contentType: contentType
  });
  
  try {
    const uploadResponse = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 60000 // 60 second timeout for large files
    });
    
    console.log('✅ PDF uploaded to Bird media API successfully');
    console.log('🔗 Bird Media URL:', mediaUrl);
    
    return {
      mediaUrl: mediaUrl,
      fileName: fileName,
      contentType: contentType
    };
    
  } catch (error) {
    throw new Error(`Upload to Bird failed: ${error.response?.data?.message || error.message}`);
  }
}

// Send PDF template with URL variable
async function sendPdfTemplate(phone, pdfPath, templateName = 'new_pdf_clone') {
  try {
    console.log('🚀 Starting PDF template send process...');
    console.log(`📱 Phone: ${phone}`);
    console.log(`📄 PDF: ${pdfPath}`);
    console.log(`📋 Template: ${templateName}`);
    
    // Upload PDF to Bird media API and get presigned URL
    const pdfUpload = await uploadPdfToBird(pdfPath);
    
    // Prepare template data
    const templateData = {
      receiver: {
        contacts: [
          {
            identifierValue: phone,
            identifierKey: "phonenumber"
          }
        ]
      },
      template: {
        projectId: '1c05f3a5-c35a-404f-9ac8-7af994fbeab1', // Your template project ID
        version: '69fd8207-d141-4e06-af6b-18657af3ae26', // Your template version ID
        locale: 'ar', // Arabic locale
        parameters: [
          {
            type: "string",
            key: "url",
            value: pdfUpload.mediaUrl  // This replaces the {url} variable with Bird's presigned URL
          }
        ]
      }
    };
    
    console.log('\n📤 Sending template with Bird presigned URL...');
    console.log('🔗 Bird Media URL:', pdfUpload.mediaUrl);
    
    // Send the template
    const response = await axios.post(
      `https://api.bird.com/workspaces/${WORKSPACE_ID}/channels/${CHANNEL_ID}/messages`,
      templateData,
      {
        headers: {
          'Authorization': `AccessKey ${ACCESS_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n✅ Template sent successfully!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    return {
      success: true,
      messageId: response.data.id,
      pdfUrl: pdfUpload.mediaUrl,
      fileName: pdfUpload.fileName,
      templateName: templateName
    };
    
  } catch (error) {
    console.error('\n❌ Error sending PDF template:', error.message);
    if (error.response) {
      console.error('📊 Error response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('📤 PDF Template Sender with URL Variable\n');
    console.log('Usage:');
    console.log('  node send-pdf-template-with-url.js <phone> <pdf-path> [template-name]\n');
    console.log('Arguments:');
    console.log('  phone         Phone number (with country code, e.g., +201100414204)');
    console.log('  pdf-path      Path to PDF file');
    console.log('  template-name Template name (optional, defaults to "new_pdf_clone")\n');
    console.log('Examples:');
    console.log('  node send-pdf-template-with-url.js +201100414204 "D:\\Results\\file.pdf"');
    console.log('  node send-pdf-template-with-url.js +201100414204 "D:\\Results\\file.pdf" "my_template"');
    console.log('\n💡 Make sure:');
    console.log('  - PM2 services are running (pm2 status)');
    console.log('  - Ngrok tunnel is active');
    console.log('  - PDF file exists');
    console.log('  - BIRD_API_KEY is set in environment');
    process.exit(1);
  }
  
  return {
    phone: args[0],
    pdfPath: args[1],
    templateName: args[2] || 'new_pdf_clone'
  };
}

// Main execution
async function main() {
  try {
    const { phone, pdfPath, templateName } = parseArgs();
    
    console.log('🎯 PDF Template Sender with URL Variable');
    console.log('==========================================\n');
    
    const result = await sendPdfTemplate(phone, pdfPath, templateName);
    
    console.log('\n🎉 Success!');
    console.log(`📱 Sent to: ${phone}`);
    console.log(`📄 PDF: ${result.fileName}`);
    console.log(`🔗 Bird Media URL: ${result.pdfUrl}`);
    console.log(`📋 Template: ${result.templateName}`);
    console.log(`🆔 Message ID: ${result.messageId}`);
    
  } catch (error) {
    console.error('\n💥 Failed to send PDF template:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { sendPdfTemplate, uploadPdfToBird };
