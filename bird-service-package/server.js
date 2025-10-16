/**
 * Bird WhatsApp Service Server
 * Standalone server for handling Bird WhatsApp API and webhooks
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const BirdService = require('./bird-service');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Bird service
let birdService;
try {
  birdService = new BirdService();
  console.log('✅ Bird service initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Bird service:', error.message);
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  const config = birdService.validateConfig();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config: config.valid ? config.config : { error: config.error }
  });
});

// Send template message endpoint
app.post('/api/send-template', async (req, res) => {
  try {
    const { phoneNumber, projectId, templateVersion, locale, parameters } = req.body;

    if (!phoneNumber || !projectId || !templateVersion) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, projectId, templateVersion'
      });
    }

    const result = await birdService.sendTemplateMessage(
      phoneNumber,
      projectId,
      templateVersion,
      locale || 'ar',
      parameters || []
    );

    res.json(result);
  } catch (error) {
    console.error('❌ Send template error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send text message endpoint
app.post('/api/send-text', async (req, res) => {
  try {
    const { phoneNumber, text } = req.body;

    if (!phoneNumber || !text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, text'
      });
    }

    const result = await birdService.sendTextMessage(phoneNumber, text);
    res.json(result);
  } catch (error) {
    console.error('❌ Send text error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send invoice template endpoint
app.post('/api/send-invoice', async (req, res) => {
  try {
    const { phoneNumber, invoiceData } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: phoneNumber'
      });
    }

    const result = await birdService.sendInvoiceTemplate(phoneNumber, invoiceData || {});
    res.json(result);
  } catch (error) {
    console.error('❌ Send invoice error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Flexible template endpoint
app.post('/api/send-template/:templateName', async (req, res) => {
  try {
    const { templateName } = req.params;
    const { phoneNumber, data } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: phoneNumber'
      });
    }

    if (!templateName) {
      return res.status(400).json({
        success: false,
        error: 'Missing template name in URL'
      });
    }

    console.log(`📤 Sending ${templateName} template to ${phoneNumber}`);
    console.log('📊 Template data:', data);

    const result = await birdService.sendTemplate(phoneNumber, templateName.toUpperCase(), data || {});
    res.json(result);
  } catch (error) {
    console.error(`❌ Send ${req.params.templateName} template error:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Bird webhook endpoint
app.post('/api/bird/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Process the webhook
    const processResult = birdService.processWebhook(webhookData);
    
    if (!processResult.success) {
      console.error('❌ Webhook processing failed:', processResult.error);
      return res.status(400).json({ success: false, error: processResult.error });
    }

    // If it's a postback event, send a reply
    if (processResult.shouldReply) {
      const replyText = birdService.getReplyMessage(processResult.postbackPayload);
      
      if (replyText) {
        try {
          const replyResult = await birdService.sendTextMessage(processResult.contact, replyText);
          
          if (replyResult.success) {
            console.log('✅ Reply sent successfully to', processResult.contact);
          } else {
            console.log('⚠️ Reply failed:', replyResult.error);
            console.log('📝 Would have sent to', processResult.contact, ':', replyText);
          }
        } catch (error) {
          console.log('⚠️ Bird message send failed:', error);
          console.log('📝 Would have sent to', processResult.contact, ':', replyText);
        }
      } else {
        console.log('ℹ️ No reply configured for payload:', processResult.postbackPayload);
      }
    } else {
      console.log('ℹ️ Event not handled:', { 
        event: processResult.event, 
        hasContact: !!processResult.contact, 
        hasPostback: !!processResult.postbackPayload 
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// Handle other HTTP methods for webhook
app.get('/api/bird/webhook', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.put('/api/bird/webhook', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

app.delete('/api/bird/webhook', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Bird WhatsApp Service running on port ${port}`);
  console.log(`📡 Health check: http://localhost:${port}/health`);
  console.log(`🔗 Webhook URL: http://localhost:${port}/api/bird/webhook`);
  console.log(`📤 Send template: POST http://localhost:${port}/api/send-template`);
  console.log(`💬 Send text: POST http://localhost:${port}/api/send-text`);
  console.log(`🧾 Send invoice: POST http://localhost:${port}/api/send-invoice`);
});

module.exports = app;
