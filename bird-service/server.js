/**
 * Bird WhatsApp Service Server
 * Handles webhooks and PDF to image conversion
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import services
const BirdService = require('./bird-service');
const PdfToImageService = require('./pdf-to-image-service');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize services
const birdService = new BirdService();
const pdfToImageService = new PdfToImageService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      bird: birdService.validateConfig().valid,
      pdfToImage: pdfToImageService.validateConfig().valid
    }
  });
});

// Bird webhook endpoint (existing functionality + PDF processing)
app.post('/api/bird/webhook', async (req, res) => {
  try {
    console.log('📩 Received Bird webhook:', JSON.stringify(req.body, null, 2));
    
    const event = req.body.event;
    const payload = req.body.payload;
    
    // Extract contact info and media info
    let contact = null;
    let postbackPayload = null;
    let mediaUrl = null;
    let mediaType = null;
    
    if (event === 'whatsapp.inbound' && payload) {
      contact = payload.sender?.contact?.identifierValue;
      
      // Check for postback actions
      if (payload.body?.text?.actions && payload.body.text.actions.length > 0) {
        const postbackAction = payload.body.text.actions.find(action => action.type === 'postback');
        if (postbackAction) {
          postbackPayload = postbackAction.postback?.payload;
        }
      }

      // Check for media attachments (PDF files)
      if (payload.body?.document) {
        mediaUrl = payload.body.document.url;
        mediaType = payload.body.document.mimeType;
      } else if (payload.body?.image) {
        mediaUrl = payload.body.image.url;
        mediaType = payload.body.image.mimeType;
      }
    }

    console.log('🔍 Extracted data:', { event, contact, postbackPayload, mediaType, hasMediaUrl: !!mediaUrl });

    // Handle PDF files first
    if (event === 'whatsapp.inbound' && contact && mediaType === 'application/pdf' && mediaUrl) {
      console.log('📄 Processing PDF file:', { contact, mediaUrl });
      
      try {
        const result = await pdfToImageService.processPdfWebhook(req.body);
        
        if (result.success) {
          console.log('✅ PDF processed successfully:', {
            contact: result.contact,
            imagesSent: result.imagesSent
          });
        } else {
          console.log('⚠️ PDF processing failed:', result.error || result.reason);
        }
        
        return res.json({ 
          success: true, 
          processed: result.success,
          message: result.success ? 'PDF converted and images sent' : (result.error || result.reason)
        });
      } catch (error) {
        console.error('❌ PDF processing error:', error.message);
        return res.status(500).json({ 
          success: false, 
          error: 'PDF processing failed' 
        });
      }
    }
    // Handle button clicks (postbacks)
    else if (event === 'whatsapp.inbound' && contact && postbackPayload) {
      const replyText = birdService.getReplyMessage(postbackPayload);
      if (replyText) {
        try {
          const sendResult = await birdService.sendTextMessage(contact, replyText);
          console.log('✅ Reply sent:', sendResult);
        } catch (error) {
          console.error('❌ Failed to send reply:', error.message);
        }
      }
      
      res.json({ success: true, processed: true });
    } else {
      console.log('ℹ️ Event not handled:', { event, hasContact: !!contact, hasPostback: !!postbackPayload, hasMedia: !!mediaUrl });
      res.json({ success: true, processed: false });
    }
  } catch (error) {
    console.error('❌ Bird webhook error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PDF to Image webhook endpoint (new functionality)
app.post('/api/bird/pdf-webhook', async (req, res) => {
  try {
    console.log('📄 Received PDF webhook:', JSON.stringify(req.body, null, 2));
    
    const result = await pdfToImageService.processPdfWebhook(req.body);
    
    if (result.success) {
      console.log('✅ PDF processed successfully:', {
        contact: result.contact,
        imagesSent: result.imagesSent
      });
    } else {
      console.log('⚠️ PDF processing failed:', result.error || result.reason);
    }
    
    res.json({ 
      success: true, 
      processed: result.success,
      message: result.success ? 'PDF converted and images sent' : (result.error || result.reason)
    });
  } catch (error) {
    console.error('❌ PDF webhook error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send template message endpoint
app.post('/api/send-template', async (req, res) => {
  try {
    const { phoneNumber, templateName, data } = req.body;
    
    if (!phoneNumber || !templateName) {
      return res.status(400).json({ error: 'phoneNumber and templateName are required' });
    }
    
    const result = await birdService.sendTemplate(phoneNumber, templateName, data);
    res.json(result);
  } catch (error) {
    console.error('❌ Template send error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Send text message endpoint
app.post('/api/send-message', async (req, res) => {
  try {
    const { phoneNumber, text } = req.body;
    
    if (!phoneNumber || !text) {
      return res.status(400).json({ error: 'phoneNumber and text are required' });
    }
    
    const result = await birdService.sendTextMessage(phoneNumber, text);
    res.json(result);
  } catch (error) {
    console.error('❌ Message send error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Send invoice template endpoint (backward compatibility)
app.post('/api/send-invoice', async (req, res) => {
  try {
    const { phoneNumber, invoiceData } = req.body;
    
    if (!phoneNumber || !invoiceData) {
      return res.status(400).json({ error: 'phoneNumber and invoiceData are required' });
    }
    
    const result = await birdService.sendInvoiceTemplate(phoneNumber, invoiceData);
    res.json(result);
  } catch (error) {
    console.error('❌ Invoice send error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Test PDF conversion endpoint
app.post('/api/test-pdf-conversion', async (req, res) => {
  try {
    const { pdfUrl, phoneNumber } = req.body;
    
    if (!pdfUrl || !phoneNumber) {
      return res.status(400).json({ error: 'pdfUrl and phoneNumber are required' });
    }
    
    console.log('🧪 Testing PDF conversion:', { pdfUrl, phoneNumber });
    
    // Download PDF
    const axios = require('axios');
    const pdfResponse = await axios.get(pdfUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000 
    });
    
    const pdfBuffer = Buffer.from(pdfResponse.data);
    console.log('📥 PDF downloaded:', { size: pdfBuffer.length });
    
    // Convert to images
    const imageFiles = await pdfToImageService.convertPdfToImages(pdfBuffer, 'test.pdf');
    console.log('🖼️ Generated images:', imageFiles);
    
    // Send images
    const results = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const imagePath = imageFiles[i];
      const optimizedPath = await pdfToImageService.optimizeImageForWhatsApp(imagePath);
      const caption = imageFiles.length > 1 
        ? `صفحة ${i + 1} من ${imageFiles.length}` 
        : 'تم تحويل الملف إلى صورة';
      
      const result = await pdfToImageService.sendImageToBird(phoneNumber, optimizedPath, caption);
      results.push(result);
      
      // Clean up
      await fs.promises.unlink(imagePath);
      if (optimizedPath !== imagePath) {
        await fs.promises.unlink(optimizedPath);
      }
    }
    
    res.json({
      success: true,
      imagesSent: results.length,
      results
    });
  } catch (error) {
    console.error('❌ Test PDF conversion error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Cleanup endpoint
app.post('/api/cleanup', async (req, res) => {
  try {
    await pdfToImageService.cleanupOldFiles(24); // Clean files older than 24 hours
    res.json({ success: true, message: 'Cleanup completed' });
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Configuration validation endpoint
app.get('/api/config', (req, res) => {
  const birdConfig = birdService.validateConfig();
  const pdfConfig = pdfToImageService.validateConfig();
  
  res.json({
    bird: birdConfig,
    pdfToImage: pdfConfig,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(port, () => {
  console.log('🕊️ Bird WhatsApp Service started');
  console.log(`📡 Server running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📩 Bird webhook: http://localhost:${port}/api/bird/webhook`);
  console.log(`📄 PDF webhook: http://localhost:${port}/api/bird/pdf-webhook`);
  
  // Validate configuration
  const birdConfig = birdService.validateConfig();
  const pdfConfig = pdfToImageService.validateConfig();
  
  if (!birdConfig.valid) {
    console.error('❌ Bird configuration invalid:', birdConfig.error);
  } else {
    console.log('✅ Bird configuration valid');
  }
  
  if (!pdfConfig.valid) {
    console.error('❌ PDF service configuration invalid:', pdfConfig.error);
  } else {
    console.log('✅ PDF service configuration valid');
  }
  
  // Schedule cleanup every hour
  setInterval(async () => {
    try {
      await pdfToImageService.cleanupOldFiles(24);
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error.message);
    }
  }, 60 * 60 * 1000); // 1 hour
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
