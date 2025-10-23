import axios from 'axios';

// 🕊️ Bird API service for sending WhatsApp messages
export async function sendBirdMessage(to: string, text: string) {
  const apiKey = process.env.BIRD_API_KEY;

  if (!apiKey) {
    throw new Error('BIRD_API_KEY is not configured in environment variables');
  }

  try {
    console.log('🕊️ Sending Bird message:', { to, text: text.substring(0, 50) + '...' });

    // Try the template API approach first (using workspace/channel structure)
    const workspaceId = '2d7a1e03-25e4-401e-bf1e-0ace545673d7';
    const channelId = '8e046034-bca7-5124-89d0-1a64c1cbe819';

    const payload = {
      receiver: {
        contacts: [
          {
            identifierValue: to,
            identifierKey: "phonenumber"
          }
        ]
      },
      body: {
        type: "text",
        text: {
          text: text
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
        timeout: 10000, // 10 second timeout
      }
    );

    console.log('✅ Bird reply sent successfully:', {
      messageId: response.data.id,
      status: response.data.status,
      to: to
    });

    return {
      success: true,
      messageId: response.data.id,
      status: response.data.status,
      data: response.data
    };
  } catch (error: any) {
    console.error('❌ Bird send failed:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // Log the error but don't throw - let the webhook continue
    console.log('⚠️ Bird message send failed, but webhook will continue');
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

// 🕊️ Helper to validate Bird configuration
export function validateBirdConfig() {
  const apiKey = process.env.BIRD_API_KEY;
  const whatsappNumber = process.env.BIRD_WHATSAPP_NUMBER;

  if (!apiKey) {
    throw new Error('BIRD_API_KEY is required in environment variables');
  }

  if (!whatsappNumber) {
    console.warn('⚠️ BIRD_WHATSAPP_NUMBER not set, using default: +201100414204');
  }

  return {
    apiKey: !!apiKey,
    whatsappNumber: whatsappNumber || '+201100414204'
  };
}

// 🕊️ Send template-based message via Bird API
export async function sendBirdTemplateMessage(
  workspaceId: string,
  channelId: string,
  projectId: string,
  templateVersion: string,
  phoneNumber: string,
  parameters: Array<{ type: string; key: string; value: string }>,
  locale: string = 'en'
) {
  const apiKey = process.env.BIRD_API_KEY;

  if (!apiKey) {
    throw new Error('BIRD_API_KEY is not configured in environment variables');
  }

  try {
    console.log('🕊️ Sending Bird template message:', { 
      workspaceId, 
      channelId, 
      projectId, 
      phoneNumber,
      parametersCount: parameters.length 
    });

    const payload = {
      receiver: {
        contacts: [
          {
            identifierValue: phoneNumber,
            identifierKey: "phonenumber"
          }
        ]
      },
      template: {
        projectId,
        version: templateVersion,
        locale,
        parameters
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
        timeout: 30000, // 30 second timeout
      }
    );

    console.log('✅ Bird template message sent successfully:', {
      messageId: response.data.id,
      status: response.data.status,
      to: phoneNumber
    });

    return {
      success: true,
      messageId: response.data.id,
      status: response.data.status,
      data: response.data
    };
  } catch (error: any) {
    console.error('❌ Bird template send failed:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    throw new Error(`Failed to send Bird template message: ${error.response?.data?.message || error.message}`);
  }
}

// 🕊️ Upload image to Bird and get media URL
export async function uploadImageToBird(imagePath: string) {
  const apiKey = process.env.BIRD_API_KEY;

  if (!apiKey) {
    throw new Error('BIRD_API_KEY is not configured in environment variables');
  }

  try {
    console.log('🕊️ Uploading image to Bird:', imagePath);

    const workspaceId = '2d7a1e03-25e4-401e-bf1e-0ace545673d7';
    const channelId = '8e046034-bca7-5124-89d0-1a64c1cbe819';

    // Step 1: Get presigned upload URL from Bird
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

    const { uploadUrl, mediaUrl } = presignResponse.data;
    console.log('📤 Got presigned upload URL from Bird');

    // Step 2: Upload the image file
    const FormData = require('form-data');
    const fs = require('fs');
    const formData = new FormData();

    // Add all form fields from uploadFormData
    Object.entries(presignResponse.data.uploadFormData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    // Add file
    const fileStream = fs.createReadStream(imagePath);
    formData.append('file', fileStream, {
      filename: require('path').basename(imagePath),
      contentType: 'image/jpeg'
    });

    await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 60000
    });

    console.log('✅ Image uploaded to Bird successfully');
    return mediaUrl;

  } catch (error: any) {
    console.error('❌ Bird image upload failed:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    throw new Error(`Failed to upload image to Bird: ${error.response?.data?.message || error.message}`);
  }
}

// 🕊️ Send image message via Bird API using media URL
export async function sendBirdImageMessage(to: string, mediaUrl: string, caption?: string) {
  const apiKey = process.env.BIRD_API_KEY;

  if (!apiKey) {
    throw new Error('BIRD_API_KEY is not configured in environment variables');
  }

  try {
    console.log('🕊️ Sending Bird image message:', { to, mediaUrl, caption });

    const workspaceId = '2d7a1e03-25e4-401e-bf1e-0ace545673d7';
    const channelId = '8e046034-bca7-5124-89d0-1a64c1cbe819';

    const payload = {
      receiver: {
        contacts: [
          {
            identifierValue: to,
            identifierKey: "phonenumber"
          }
        ]
      },
      body: {
        type: "image",
        image: {
          images: [
            {
              altText: caption || "تقرير المختبر",
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
        timeout: 30000, // 30 second timeout
      }
    );

    console.log('✅ Bird image sent successfully:', {
      messageId: response.data.id,
      status: response.data.status,
      to: to
    });

    return {
      success: true,
      messageId: response.data.id,
      status: response.data.status,
      data: response.data
    };
  } catch (error: any) {
    console.error('❌ Bird image send failed:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

// 🕊️ Test Bird API connection
export async function testBirdConnection() {
  try {
    const config = validateBirdConfig();
    console.log('🕊️ Bird configuration validated:', {
      hasApiKey: config.apiKey,
      whatsappNumber: config.whatsappNumber
    });

    // You could add a test API call here if Bird provides a test endpoint
    return {
      success: true,
      message: 'Bird configuration is valid',
      config
    };
  } catch (error: any) {
    console.error('❌ Bird configuration test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
