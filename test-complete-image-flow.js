const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testCompleteImageFlow() {
  try {
    console.log('🧪 Testing complete image flow...');
    
    const apiKey = 'EpYiBbBDjQv6U5oSty2Bxu8Ix5T9XOr9L2fl';
    const workspaceId = '2d7a1e03-25e4-401e-bf1e-0ace545673d7';
    const channelId = '8e046034-bca7-5124-89d0-1a64c1cbe819';
    const phoneNumber = '+201016666348';
    const imagePath = 'D:\\Results\\+201016666348_2000000390611\\images\\page-1.jpg';
    
    console.log(`📸 Testing with image: ${imagePath}`);
    
    // Step 1: Get presigned upload URL from Bird
    console.log('📤 Getting presigned upload URL from Bird...');
    const presignResponse = await axios.post(
      `https://api.bird.com/workspaces/${workspaceId}/channels/${channelId}/presigned-upload`,
      {
        contentType: 'image/jpeg'
      },
      {
        headers: {
          'Authorization': `AccessKey ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📤 Presigned response:', JSON.stringify(presignResponse.data, null, 2));
    
    const { uploadUrl, mediaUrl } = presignResponse.data;
    console.log('✅ Got presigned upload URL from Bird');
    console.log(`📤 Upload URL: ${uploadUrl}`);
    console.log(`📤 Media URL: ${mediaUrl}`);

    // Step 2: Upload the image file
    console.log('📤 Uploading image to Bird...');
    const formData = new FormData();

    // Add all form fields from uploadFormData
    if (presignResponse.data.uploadFormData) {
      Object.entries(presignResponse.data.uploadFormData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    // Add file
    const fileStream = fs.createReadStream(imagePath);
    formData.append('file', fileStream, {
      filename: 'page-1.jpg',
      contentType: 'image/jpeg'
    });

    await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 60000
    });

    console.log('✅ Image uploaded to Bird successfully');
    console.log(`📤 Media URL: ${mediaUrl}`);

    // Step 3: Send the image via WhatsApp
    console.log('📱 Sending image via WhatsApp...');
    const payload = {
      receiver: {
        contacts: [
          {
            identifierValue: phoneNumber,
            identifierKey: "phonenumber"
          }
        ]
      },
      body: {
        type: "image",
        image: {
          images: [
            {
              altText: "تقرير المختبر - صفحة 1",
              mediaUrl: mediaUrl
            }
          ]
        }
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

    console.log('✅ Image sent successfully via WhatsApp!', {
      messageId: response.data.id,
      status: response.data.status,
      to: phoneNumber
    });

  } catch (error) {
    console.error('❌ Test failed:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

testCompleteImageFlow();
