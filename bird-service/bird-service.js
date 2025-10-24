/**
 * Bird WhatsApp API Service
 * Handles template message sending and webhook processing
 */

const axios = require('axios');

class BirdService {
  constructor() {
    this.apiKey = process.env.BIRD_API_KEY;
    this.whatsappNumber = process.env.BIRD_WHATSAPP_NUMBER;
    this.workspaceId = process.env.BIRD_WORKSPACE_ID;
    this.channelId = process.env.BIRD_CHANNEL_ID;
    
    if (!this.apiKey) {
      throw new Error('BIRD_API_KEY is required in environment variables');
    }
  }

  /**
   * Send a template message via Bird API
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} projectId - Template project ID
   * @param {string} templateVersion - Template version ID
   * @param {string} locale - Template locale
   * @param {Array} parameters - Template parameters
   * @returns {Promise<Object>} - Response object
   */
  async sendTemplateMessage(phoneNumber, projectId, templateVersion, locale = "ar", parameters = [], templateName = null) {
    try {
      console.log('🕊️ Sending Bird template message:', { 
        phoneNumber, 
        projectId, 
        templateVersion, 
        locale,
        parametersCount: parameters.length 
      });

      // Use the correct Bird API structure (workspaces/channels endpoint)
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
          projectId: projectId,
          version: templateVersion,
          locale: locale,
          parameters: parameters
        }
      };

      const apiUrl = `https://api.bird.com/workspaces/${process.env.BIRD_WORKSPACE_ID}/channels/${process.env.BIRD_CHANNEL_ID}/messages`;

      console.log('📤 Sending POST request to Bird API:');
      console.log('URL:', apiUrl);
      console.log('Headers:', {
        Authorization: `AccessKey ${this.apiKey.substring(0, 10)}...`,
        'Content-Type': 'application/json'
      });
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        apiUrl,
        payload,
        {
          headers: {
            Authorization: `AccessKey ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
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

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }



  /**
   * Process webhook event from Bird
   * @param {Object} webhookData - Webhook payload
   * @returns {Object} - Processing result
   */
  processWebhook(webhookData) {
    try {
      console.log('📩 Processing Bird webhook event:', JSON.stringify(webhookData, null, 2));

      const event = webhookData.event;
      const payload = webhookData.payload;
      
      // Extract contact info and postback payload
      let contact = null;
      let postbackPayload = null;
      
      if (event === 'whatsapp.inbound' && payload) {
        contact = payload.sender?.contact?.identifierValue;
        
        // Check for postback actions
        if (payload.body?.text?.actions && payload.body.text.actions.length > 0) {
          const postbackAction = payload.body.text.actions.find(action => action.type === 'postback');
          if (postbackAction) {
            postbackPayload = postbackAction.postback?.payload;
          }
        }
      }

      console.log('🔍 Extracted data:', { event, contact, postbackPayload });

      return {
        success: true,
        event,
        contact,
        postbackPayload,
        shouldReply: !!(event === 'whatsapp.inbound' && contact && postbackPayload)
      };
    } catch (error) {
      console.error('❌ Webhook processing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }


  /**
   * Validate Bird configuration
   * @returns {Object} - Validation result
   */
  validateConfig() {
    const required = ['BIRD_API_KEY', 'BIRD_WORKSPACE_ID', 'BIRD_CHANNEL_ID'];
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
        channelId: this.channelId,
        whatsappNumber: this.whatsappNumber
      }
    };
  }
}

module.exports = BirdService;
