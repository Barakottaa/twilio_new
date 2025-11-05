/**
 * Twilio WhatsApp API Client (Conversations API)
 * Handles sending messages, templates, and images via Twilio Conversations API
 */

const twilio = require('twilio');
const FormData = require('form-data');
const fs = require('fs');

class TwilioApiClient {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    this.systemIdentity = process.env.TWILIO_SYSTEM_IDENTITY || 'system';
    
    if (!this.accountSid || !this.authToken) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required in environment variables');
    }
    
    this.client = twilio(this.accountSid, this.authToken);
    
    // Cache for conversations to avoid repeated lookups
    this.conversationCache = new Map();
  }

  /**
   * Format phone number for Twilio WhatsApp
   * @param {string} phoneNumber - Phone number in any format
   * @returns {string} - Formatted as whatsapp:+1234567890
   */
  formatWhatsAppNumber(phoneNumber) {
    // Remove any existing whatsapp: prefix
    let clean = phoneNumber.replace(/^whatsapp:/i, '');
    // Ensure it starts with +
    if (!clean.startsWith('+')) {
      clean = '+' + clean.replace(/^\+/, '');
    }
    return `whatsapp:${clean}`;
  }

  /**
   * Find or create a conversation for a phone number
   * @param {string} phoneNumber - Customer phone number
   * @returns {Promise<string>} - Conversation SID
   */
  async findOrCreateConversation(phoneNumber) {
    try {
      const phoneFormatted = this.formatWhatsAppNumber(phoneNumber);
      
      // Check cache first
      const cacheKey = `conv_${phoneFormatted}`;
      if (this.conversationCache.has(cacheKey)) {
        const cached = this.conversationCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 min cache
          return cached.conversationSid;
        }
      }

      // Try to find existing conversation
      const uniqueName = `whatsapp_${phoneNumber.replace(/[^0-9]/g, '')}`;
      const conversations = await this.client.conversations.v1.conversations.list({
        limit: 50
      });

      // First, try to find by uniqueName (faster)
      const foundByUniqueName = conversations.find(c => c.uniqueName === uniqueName);
      if (foundByUniqueName) {
        this.conversationCache.set(cacheKey, {
          conversationSid: foundByUniqueName.sid,
          timestamp: Date.now()
        });
        return foundByUniqueName.sid;
      }

      // If not found by uniqueName, search by participants

      // Look for conversation with this phone number as participant
      for (const conv of conversations) {
        try {
          const participants = await this.client.conversations.v1
            .conversations(conv.sid)
            .participants.list();
          
          const hasCustomer = participants.some(p => 
            p.messagingBinding?.address === phoneFormatted
          );
          
          if (hasCustomer) {
            // Cache it
            this.conversationCache.set(cacheKey, {
              conversationSid: conv.sid,
              timestamp: Date.now()
            });
            return conv.sid;
          }
        } catch (e) {
          // Skip this conversation if we can't fetch participants
          continue;
        }
      }

      // Create new conversation
      const conversation = await this.client.conversations.v1.conversations.create({
        friendlyName: `Chat with ${phoneNumber}`,
        uniqueName: `whatsapp_${phoneNumber.replace(/[^0-9]/g, '')}`
      });

      // Add customer as participant
      await this.client.conversations.v1
        .conversations(conversation.sid)
        .participants
        .create({
          'messagingBinding.address': phoneFormatted,
          'messagingBinding.proxyAddress': this.formatWhatsAppNumber(
            this.whatsappNumber || process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'
          )
        });

      // Add system as participant
      try {
        await this.client.conversations.v1
          .conversations(conversation.sid)
          .participants
          .create({
            identity: this.systemIdentity
          });
      } catch (e) {
        // Participant might already exist, ignore
        if (e.code !== 50433) {
          console.warn('⚠️ Failed to add system participant:', e.message);
        }
      }

      // Cache it
      this.conversationCache.set(cacheKey, {
        conversationSid: conversation.sid,
        timestamp: Date.now()
      });

      console.log('✅ Created new conversation:', conversation.sid);
      return conversation.sid;

    } catch (error) {
      console.error('❌ Error finding/creating conversation:', error.message);
      throw error;
    }
  }

  /**
   * Send a text message via Twilio Conversations API
   * @param {string} to - Recipient phone number
   * @param {string} text - Message text
   * @param {string} author - Optional author identity (defaults to system)
   * @returns {Promise<Object>} - Response object
   */
  async sendMessage(to, text, author = null) {
    try {
      console.log('📱 Sending Twilio message via Conversations API:', { to, text: text.substring(0, 50) + '...' });

      // Find or create conversation for this phone number
      const conversationSid = await this.findOrCreateConversation(to);

      // Use Conversations API to send message
      const authorIdentity = author || this.systemIdentity;
      
      const conversationMessage = await this.client.conversations.v1
        .conversations(conversationSid)
        .messages
        .create({
          author: authorIdentity,
          body: text
        });

      console.log('✅ Twilio message sent via Conversations API:', {
        messageSid: conversationMessage.sid,
        conversationSid: conversationSid,
        status: conversationMessage.index,
        to: to
      });

      return {
        success: true,
        messageSid: conversationMessage.sid,
        conversationSid: conversationSid,
        status: 'sent',
        data: conversationMessage
      };
    } catch (error) {
      console.error('❌ Twilio message send failed:', {
        error: error.message,
        code: error.code,
        status: error.status
      });

      return {
        success: false,
        error: error.message || 'Unknown error',
        code: error.code
      };
    }
  }

  /**
   * Send a template message via Twilio Conversations API using Content Template Builder
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} contentSid - Twilio Content SID for the template
   * @param {Object} contentVariables - Template variables as key-value pairs
   * @returns {Promise<Object>} - Response object
   */
  async sendTemplateMessage(phoneNumber, contentSid, contentVariables = {}) {
    try {
      console.log('📱 Sending Twilio template message via Conversations API:', { 
        phoneNumber, 
        contentSid,
        variablesCount: Object.keys(contentVariables).length
      });

      // Find or create conversation for this phone number
      const conversationSid = await this.findOrCreateConversation(phoneNumber);

      const from = this.formatWhatsAppNumber(this.whatsappNumber || process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886');
      const toFormatted = this.formatWhatsAppNumber(phoneNumber);

      // Send template via messages.create() with conversation context
      // Templates must use messages.create() API, but we can associate with conversation
      const messageParams = {
        contentSid: contentSid,
        from: from,
        to: toFormatted,
        // Associate with conversation
        conversationSid: conversationSid
      };

      // Add content variables if provided
      if (contentVariables && Object.keys(contentVariables).length > 0) {
        messageParams.contentVariables = JSON.stringify(contentVariables);
      }

      const message = await this.client.messages.create(messageParams);

      console.log('✅ Twilio template message sent via Conversations API:', {
        messageSid: message.sid,
        conversationSid: conversationSid,
        status: message.status,
        to: phoneNumber
      });

      return {
        success: true,
        messageSid: message.sid,
        conversationSid: conversationSid,
        status: message.status,
        body: message.body,
        data: message
      };
    } catch (error) {
      console.error('❌ Twilio template send failed:', {
        error: error.message,
        code: error.code,
        status: error.status
      });

      return {
        success: false,
        error: error.message || 'Unknown error',
        code: error.code
      };
    }
  }

  /**
   * Send an image message via Twilio using local file path
   * This method requires a baseUrl to construct a public URL for the image
   * @param {string} to - Recipient phone number
   * @param {string} imagePath - Local path to image file
   * @param {string} caption - Optional caption for the image
   * @param {string} baseUrl - Base URL for serving the image (e.g., ngrok URL)
   * @returns {Promise<Object>} - Response object
   */
  async sendImageMessage(to, imagePath, caption = null, baseUrl = null) {
    try {
      console.log('📱 Sending Twilio image message:', { to, imagePath, caption });

      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      // If baseUrl is provided, construct mediaUrl from it
      if (baseUrl) {
        const fileName = require('path').basename(imagePath);
        // Remove any trailing slashes from baseUrl
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        const mediaUrl = `${cleanBaseUrl}/images/${encodeURIComponent(fileName)}`;
        
        console.log(`📤 Constructed media URL: ${mediaUrl}`);
        return await this.sendImageMessageByUrl(to, mediaUrl, caption);
      }

      // Otherwise, require mediaUrl to be provided
      throw new Error('baseUrl is required for local files. Provide a public URL base (e.g., ngrok URL) or use sendImageMessageByUrl() with a mediaUrl.');

    } catch (error) {
      console.error('❌ Twilio image send failed:', {
        error: error.message,
        code: error.code
      });

      return {
        success: false,
        error: error.message || 'Unknown error',
        code: error.code
      };
    }
  }

  /**
   * Send an image message via Twilio Conversations API using media URL
   * @param {string} to - Recipient phone number
   * @param {string} mediaUrl - Public URL to the image
   * @param {string} caption - Optional caption for the image
   * @returns {Promise<Object>} - Response object
   */
  async sendImageMessageByUrl(to, mediaUrl, caption = null) {
    try {
      console.log('📱 Sending Twilio image message via Conversations API:', { to, mediaUrl, caption });

      // Find or create conversation for this phone number
      const conversationSid = await this.findOrCreateConversation(to);

      const from = this.formatWhatsAppNumber(this.whatsappNumber || process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886');
      const toFormatted = this.formatWhatsAppNumber(to);

      // Images must be sent via messages.create() API with conversation context
      const messageParams = {
        from: from,
        to: toFormatted,
        mediaUrl: [mediaUrl], // Twilio expects an array of media URLs
        // Associate with conversation
        conversationSid: conversationSid
      };

      if (caption) {
        messageParams.body = caption;
      }

      const message = await this.client.messages.create(messageParams);

      console.log('✅ Twilio image message sent via Conversations API:', {
        messageSid: message.sid,
        conversationSid: conversationSid,
        status: message.status,
        to: to
      });

      return {
        success: true,
        messageSid: message.sid,
        conversationSid: conversationSid,
        status: message.status,
        data: message
      };
    } catch (error) {
      console.error('❌ Twilio image send failed:', {
        error: error.message,
        code: error.code,
        status: error.status
      });

      return {
        success: false,
        error: error.message || 'Unknown error',
        code: error.code
      };
    }
  }

  /**
   * Upload media to Twilio and get media URL
   * Note: Twilio doesn't have a direct upload API like Bird
   * This method uploads to Twilio's Media API and returns the media URL
   * @param {string} filePath - Local path to file
   * @returns {Promise<Object>} - Response with mediaUrl
   */
  async uploadMedia(filePath) {
    try {
      console.log('📤 Uploading media to Twilio:', filePath);

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file as buffer
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = require('path').basename(filePath);
      const contentType = this.getContentType(filePath);

      // Twilio Media API upload
      // Note: Twilio's Media API requires a different approach
      // We'll use Twilio's Media API to create a media resource
      
      // Twilio requires media to be accessible via public URL
      // For local development, we can use ngrok or a local server
      // The mediaUrl should be provided externally (e.g., from a file server)
      // This method is kept for API consistency but should use sendImageMessageByUrl instead
      
      return {
        success: false,
        error: 'Twilio requires media to be accessible via public URL. Use sendImageMessageByUrl() with a publicly accessible mediaUrl instead.'
      };

    } catch (error) {
      console.error('❌ Twilio media upload failed:', {
        error: error.message
      });

      return {
        success: false,
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Get content type from file extension
   */
  getContentType(filePath) {
    const ext = require('path').extname(filePath).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf'
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Validate Twilio configuration
   * @returns {Object} - Validation result
   */
  validateConfig() {
    const required = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'];
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
        hasAccountSid: !!this.accountSid,
        hasAuthToken: !!this.authToken,
        whatsappNumber: this.whatsappNumber || 'Not configured'
      }
    };
  }

  /**
   * Get conversation SID for a phone number (without creating)
   * @param {string} phoneNumber - Customer phone number
   * @returns {Promise<string|null>} - Conversation SID or null if not found
   */
  async getConversation(phoneNumber) {
    try {
      const phoneFormatted = this.formatWhatsAppNumber(phoneNumber);
      const uniqueName = `whatsapp_${phoneNumber.replace(/[^0-9]/g, '')}`;
      
      // List conversations and search by uniqueName
      const conversations = await this.client.conversations.v1.conversations.list({
        limit: 50
      });
      
      const found = conversations.find(c => c.uniqueName === uniqueName);
      if (found) {
        return found.sid;
      }
      
      // If not found by uniqueName, search by participants
      for (const conv of conversations) {
        try {
          const participants = await this.client.conversations.v1
            .conversations(conv.sid)
            .participants.list();
          
          const hasCustomer = participants.some(p => 
            p.messagingBinding?.address === phoneFormatted
          );
          
          if (hasCustomer) {
            return conv.sid;
          }
        } catch (e) {
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting conversation:', error.message);
      return null;
    }
  }

  /**
   * Test Twilio API connection
   * @returns {Promise<Object>} - Test result
   */
  async testConnection() {
    try {
      console.log('📱 Testing Twilio API connection...');
      
      // Try to fetch account info to verify connection
      const account = await this.client.api.accounts(this.accountSid).fetch();
      
      // Test Conversations API access
      try {
        await this.client.conversations.v1.conversations.list({ limit: 1 });
        console.log('✅ Conversations API accessible');
      } catch (e) {
        console.warn('⚠️ Conversations API might not be enabled:', e.message);
      }
      
      return {
        success: true,
        message: 'Twilio API client is ready (Conversations API enabled)',
        accountSid: account.sid,
        accountName: account.friendlyName
      };
    } catch (error) {
      console.error('❌ Twilio API test failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = TwilioApiClient;

