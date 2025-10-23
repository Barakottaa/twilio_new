const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function generateAndSendReport() {
  try {
    console.log('🧪 Generating lab report and sending via template...');
    
    // Step 1: Generate a lab report using the lab-reports-service
    console.log('📊 Generating lab report...');
    const generateResponse = await axios.post('http://localhost:3000/api/generate-report', {
      patient_phone: '+201016666348',
      patient_name: 'عبدالرحمن بركة',
      reg_key: '2000000390612'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    console.log('✅ Report generated:', generateResponse.data);
    
    // Step 2: Upload the generated PDF to Bird and get media URL
    console.log('📤 Uploading PDF to Bird...');
    const apiKey = 'EpYiBbBDjQv6U5oSty2Bxu8Ix5T9XOr9L2fl';
    const workspaceId = '2d7a1e03-25e4-401e-bf1e-0ace545673d7';
    const channelId = '8e046034-bca7-5124-89d0-1a64c1cbe819';
    const phoneNumber = '+201016666348';
    
    // Get presigned upload URL
    const presignResponse = await axios.post(
      `https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/presigned-upload`,
      {
        contentType: 'application/pdf'
      },
      {
        headers: {
          'Authorization': `AccessKey ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { uploadUrl, mediaUrl } = presignResponse.data;
    console.log('📤 Got presigned upload URL from Bird');

    // Upload the PDF file
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Add all form fields from uploadFormData
    if (presignResponse.data.uploadFormData) {
      Object.entries(presignResponse.data.uploadFormData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    // Add the PDF file
    const pdfPath = generateResponse.data.pdfPath;
    const fileStream = fs.createReadStream(pdfPath);
    formData.append('file', fileStream, {
      filename: path.basename(pdfPath),
      contentType: 'application/pdf'
    });

    await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 60000
    });

    console.log('✅ PDF uploaded to Bird successfully');
    console.log(`📤 Media URL: ${mediaUrl}`);

    // Step 3: Send template with the uploaded PDF
    console.log('📱 Sending template with PDF...');
    const payload = {
      receiver: {
        contacts: [{
          identifierKey: 'phonenumber',
          identifierValue: phoneNumber
        }]
      },
      template: {
        projectId: '1c05f3a5-c35a-404f-9ac8-7af994fbeab1', // new_pdf_clone template with buttons
        version: '10e2dd22-b794-422f-8ab0-259d2a46327c', // new_pdf_clone template version
        locale: 'ar',
        parameters: [{
          type: 'string',
          key: 'url',
          value: mediaUrl
        }, {
          type: 'string', 
          key: 'patient_name',
          value: 'عبدالرحمن بركة'
        }]
      }
    };

    const response = await axios.post(
      `https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/messages`,
      payload,
      {
        headers: {
          Authorization: `AccessKey ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('✅ Template with PDF sent successfully!', {
      messageId: response.data.id,
      status: response.data.status,
      to: phoneNumber
    });
    console.log('🎯 Now you can test the "عايز التقرير في صور" button!');

  } catch (error) {
    console.error('❌ Generate and send failed:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

generateAndSendReport();
