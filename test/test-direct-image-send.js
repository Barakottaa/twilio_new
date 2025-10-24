const axios = require('axios');

async function testDirectImageSend() {
  try {
    console.log('🧪 Testing direct image send via Bird API...');
    
    const apiKey = 'EpYiBbBDjQv6U5oSty2Bxu8Ix5T9XOr9L2fl';
    const workspaceId = '2d7a1e03-25e4-401e-bf1e-0ace545673d7';
    const channelId = '8e046034-bca7-5124-89d0-1a64c1cbe819';
    const phoneNumber = '+201016666348';
    const imageUrl = 'http://localhost:3003/images/+201016666348_2000000390611/images/page-1.jpg';
    
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
        type: "media",
        media: {
          type: "image",
          link: imageUrl
        }
      }
    };

    console.log(`📸 Sending image to ${phoneNumber}: ${imageUrl}`);
    
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

    console.log('✅ Image sent successfully!', {
      messageId: response.data.id,
      status: response.data.status,
      to: phoneNumber
    });

  } catch (error) {
    console.error('❌ Image send failed:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

testDirectImageSend();
