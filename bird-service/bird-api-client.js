const axios = require('axios');

// 🕊️ Bird API client for sending WhatsApp messages
class BirdApiClient {
  constructor() {
    this.apiKey = process.env.BIRD_API_KEY;
    this.workspaceId = '2d7a1e03-25e4-401e-bf1e-0ace545673d7';
    this.channelId = '8e046034-bca7-5124-89d0-1a64c1cbe819';
    
    if (!this.apiKey) {
      throw new Error('BIRD_API_KEY is not configured in environment variables');
    }
  }

  // 🕊️ Send text message via Bird API
  async sendMessage(to, text) {
    try {
      console.log('🕊️ Sending Bird message:', { to, text: text.substring(0, 50) + '...' });

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
        `https://api.bird.com/workspaces/${this.workspaceId}/channels/${this.channelId}/messages`,
        payload,
        {
          headers: {
            Authorization: `AccessKey ${this.apiKey}`,
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
    } catch (error) {
      console.error('❌ Bird send failed:', {
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

  // 🕊️ Send template message via Bird API
  async sendTemplateMessage(phoneNumber, projectId, templateVersion, locale = "ar", parameters = []) {
    try {
      console.log('🕊️ Sending Bird template message:', { 
        phoneNumber, 
        projectId, 
        templateVersion, 
        locale,
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
        `https://api.bird.com/workspaces/${this.workspaceId}/channels/${this.channelId}/messages`,
        payload,
        {
          headers: {
            Authorization: `AccessKey ${this.apiKey}`,
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
    } catch (error) {
      console.error('❌ Bird template send failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      throw new Error(`Failed to send Bird template message: ${error.response?.data?.message || error.message}`);
    }
  }

  // 🕊️ Upload image to Bird and get media URL
  async uploadImage(imagePath) {
    try {
      console.log('🕊️ Uploading image to Bird:', imagePath);

      // Step 1: Get presigned upload URL from Bird
      const presignResponse = await axios.post(
        `https://api.bird.com/workspaces/${this.workspaceId}/channels/${this.channelId}/presigned-upload`,
        {
          contentType: 'image/jpeg'
        },
        {
          headers: {
            'Authorization': `AccessKey ${this.apiKey}`,
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
      return {
        success: true,
        mediaUrl: mediaUrl
      };

    } catch (error) {
      console.error('❌ Bird image upload failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      throw new Error(`Failed to upload image to Bird: ${error.response?.data?.message || error.message}`);
    }
  }

  // 🕊️ Send image message via Bird API using media URL
  async sendImageMessage(to, mediaUrl, caption) {
    try {
      console.log('🕊️ Sending Bird image message:', { to, mediaUrl, caption });

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
        `https://api.bird.com/workspaces/${this.workspaceId}/channels/${this.channelId}/messages`,
        payload,
        {
          headers: {
            Authorization: `AccessKey ${this.apiKey}`,
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
    } catch (error) {
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
  async testConnection() {
    try {
      console.log('🕊️ Testing Bird API connection...');
      
      // You could add a test API call here if Bird provides a test endpoint
      return {
        success: true,
        message: 'Bird API client is ready',
        workspaceId: this.workspaceId,
        channelId: this.channelId
      };
    } catch (error) {
      console.error('❌ Bird API test failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 🕊️ Validate Bird configuration
  validateConfig() {
    const required = ['BIRD_API_KEY'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      return {
        valid: false,
        missing,
        error: `Missing required environment variables: ${missing.join(', ')}`
      };
    }

    return {
      valid: true,
      config: {
        hasApiKey: !!this.apiKey,
        workspaceId: this.workspaceId,
        channelId: this.channelId
      }
    };
  }
}

module.exports = BirdApiClient;
