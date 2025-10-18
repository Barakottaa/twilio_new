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
   * Send a simple text message via Bird API
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} text - Message text
   * @returns {Promise<Object>} - Response object
   */
  async sendTextMessage(phoneNumber, text) {
    try {
      console.log('🕊️ Sending Bird text message:', { 
        phoneNumber, 
        text: text.substring(0, 50) + '...' 
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
          timeout: 10000,
        }
      );

      console.log('✅ Bird text message sent successfully:', {
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
      console.error('❌ Bird text send failed:', {
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
   * Send template message with flexible configuration
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} templateName - Template name (e.g., 'INVOICE', 'WELCOME', 'REMINDER')
   * @param {Object} data - Template data
   * @returns {Promise<Object>} - Response object
   */
  async sendTemplate(phoneNumber, templateName, data) {
    const projectId = process.env[`${templateName}_TEMPLATE_PROJECT_ID`];
    const templateVersion = process.env[`${templateName}_TEMPLATE_VERSION_ID`];
    const parameterNames = process.env[`${templateName}_TEMPLATE_PARAMETERS`];

    if (!projectId || !templateVersion) {
      throw new Error(`${templateName} template configuration missing in environment variables`);
    }

    if (!parameterNames) {
      throw new Error(`${templateName} template parameters not defined in environment variables`);
    }

    // Parse parameter names from comma-separated string
    const paramNames = parameterNames.split(',').map(name => name.trim());
    
    // Build parameters array dynamically
    const parameters = paramNames.map(paramName => {
      const value = data[paramName] || this.getDefaultValue(paramName);
      return {
        type: "string",
        key: paramName,
        value: value
      };
    });

    console.log(`📋 Sending ${templateName} template with parameters:`, parameters);

    return await this.sendTemplateMessage(
      phoneNumber,
      projectId,
      templateVersion,
      "ar",
      parameters,
      templateName
    );
  }

  /**
   * Get default values for template parameters
   * @param {string} paramName - Parameter name
   * @returns {string} - Default value
   */
  getDefaultValue(paramName) {
    const defaults = {
      'patient_name': 'عبدالرحمن',
      'customer_name': 'عميل',
      'lab_no': '1',
      'total_paid': '400',
      'remaining': '100',
      'total_cost': '400',
      'appointment_date': new Date().toLocaleDateString('ar-EG'),
      'appointment_time': '10:00 ص',
      'doctor_name': 'د. أحمد بركة'
    };
    return defaults[paramName] || 'غير محدد';
  }

  /**
   * Send invoice template message (backward compatibility)
   * @param {string} phoneNumber - Recipient phone number
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise<Object>} - Response object
   */
  async sendInvoiceTemplate(phoneNumber, invoiceData) {
    return await this.sendTemplate(phoneNumber, 'INVOICE', {
      patient_name: invoiceData.patientName,
      lab_no: invoiceData.labNo,
      total_paid: invoiceData.totalPaid,
      remaining: invoiceData.remaining
    });
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
   * Get reply message for postback payload
   * @param {string} payload - Postback payload
   * @returns {string} - Reply message
   */
  getReplyMessage(payload) {
    const replies = {
      'PAY_INSTAPAY': 'ده رقم انستاباي 01005648997 حول عليه وابعت صورة التحويل علي رقم 01120035300',
      'PAY_VCASH': 'ده رقم فودافون كاش 01120035300 حول عليه وابعت علي صورة التحويل عشان نسجل التحويل'
    };

    return replies[payload] || '';
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
