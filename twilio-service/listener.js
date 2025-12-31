/**
 * Twilio WhatsApp Listener
 * Receives requests from Twilio webhooks and handles PDF to image conversion
 */

const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local first, then .env
const envLocalPath = path.join(__dirname, '.env.local');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
  console.log('📋 Loaded environment from .env.local');
} else if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('📋 Loaded environment from .env');
}

const express = require('express');
const cors = require('cors');

// Import services
const PdfToImageService = require('./pdf-to-image-service');
const TwilioApiClient = require('./twilio-api-client');
const logger = require('../shared_utils/logger')('twilio-service');

const app = express();
const port = process.env.PORT || 3002; // Different port from bird-service

// Initialize services
const pdfToImageService = new PdfToImageService();
const twilioApiClient = new TwilioApiClient();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'twilio-service',
    services: {
      twilio: twilioApiClient.validateConfig().valid,
      pdfToImage: pdfToImageService.validateConfig().valid
    }
  });
});

// Serve images for Twilio (Twilio requires public URLs for media)
app.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const resultsDir = process.env.PDF_BASE_DIR || "D:\\Results";

  // Search for the image in all patient folders
  try {
    const folders = fs.readdirSync(resultsDir);
    let imagePath = null;

    for (const folder of folders) {
      const folderPath = path.join(resultsDir, folder);
      if (fs.statSync(folderPath).isDirectory()) {
        const imagesDir = path.join(folderPath, 'images');
        if (fs.existsSync(imagesDir)) {
          const fullImagePath = path.join(imagesDir, filename);
          if (fs.existsSync(fullImagePath)) {
            imagePath = fullImagePath;
            break;
          }
        }
      }
    }

    if (!imagePath) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Set headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('ngrok-skip-browser-warning', 'true');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.sendFile(path.resolve(imagePath));
  } catch (error) {
    console.error('❌ Error serving image:', error.message);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Twilio webhook endpoint - processes patient requests and converts PDFs to images
app.post('/api/twilio/webhook', async (req, res) => {
  try {
    logger.info('📩 [listener] Received Twilio webhook request', req.body);

    const { TwilioWebhookSchema } = require('../shared_utils/schemas');
    const validation = TwilioWebhookSchema.safeParse(req.body);

    if (!validation.success) {
      logger.warn('❌ [listener] Invalid Twilio request:', validation.error);
      return res.json({ success: false, error: 'Invalid request format' });
    }

    const { From, Body, MessageSid, FromCountry } = validation.data;
    let phoneNumber, message;

    if (From) {
      phoneNumber = From.replace(/^whatsapp:/i, '');
      message = Body || MessageSid || '';
    } else {
      phoneNumber = `+${FromCountry}${req.body.From}`; // req.body.From fallback for partial match
      message = Body || '';
    }

    logger.info('🔍 [listener] Extracted data from Twilio request', { phoneNumber, message });

    if (!phoneNumber) {
      logger.warn('❌ [listener] No phone number found in Twilio request');
      return res.json({
        success: false,
        error: 'No phone number found in request'
      });
    }

    // Check if this is a request for images (PDF conversion)
    if (message?.toLowerCase().includes('image') || message?.toLowerCase().includes('صورة')) {
      logger.info('ℹ️ [listener] Patient requested PDF to images conversion', { phoneNumber, message });

      // Send immediate response to prevent timeout
      res.json({
        success: true,
        message: 'Request accepted - processing PDF conversion',
        patient: phoneNumber,
        status: 'processing'
      });

      // Process PDF in background (don't await)
      setImmediate(async () => {
        try {
          logger.info('🔄 [background] Starting PDF processing...');
          const result = await pdfToImageService.processPdfFromFolder(phoneNumber);

          if (result.success) {
            console.log('✅ [background] PDF converted and images sent successfully');
            console.log(`   Images sent: ${result.imagesSent}`);
            console.log(`   Patient: ${phoneNumber}`);
          } else {
            logger.error('❌ [background] PDF conversion failed:', result.error);
          }
        } catch (error) {
          logger.error('❌ [background] PDF processing error:', error.message);
        }
      });
    } else {
      // Handle other types of requests - but if we have a phone number, try PDF conversion anyway
      console.log('ℹ️ [listener] Non-PDF request received, but trying PDF conversion anyway');

      try {
        // Process PDF from folder for this patient
        const result = await pdfToImageService.processPdfFromFolder(phoneNumber);

        if (result.success) {
          console.log('✅ PDF converted and images sent successfully');
          console.log(`   Images sent: ${result.imagesSent}`);
          console.log(`   Patient: ${phoneNumber}`);

          res.json({
            success: true,
            message: `PDF converted to ${result.imagesSent} images and sent to ${phoneNumber}`,
            patient: phoneNumber,
            imagesSent: result.imagesSent,
            folder: result.folder,
            pdfFile: result.pdfFile
          });
        } else {
          console.log('❌ PDF conversion failed:', result.error);
          res.json({
            success: false,
            error: result.error,
            patient: phoneNumber
          });
        }
      } catch (error) {
        console.log('❌ [listener] PDF processing error:', error.message);
        res.json({
          success: false,
          error: error.message,
          patient: phoneNumber
        });
      }
    }

  } catch (error) {
    logger.error('❌ Twilio webhook error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Process PDF from folder endpoint
app.post('/api/process-pdf-folder', async (req, res) => {
  try {
    const { ProcessPdfSchema } = require('../shared_utils/schemas');
    const validation = ProcessPdfSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues[0].message });
    }

    const { phoneNumber } = validation.data;

    console.log('📄 Processing PDF from folder for:', phoneNumber);

    const result = await pdfToImageService.processPdfFromFolder(phoneNumber);
    res.json(result);
  } catch (error) {
    console.error('❌ PDF processing error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Configuration validation endpoint
app.get('/api/config', (req, res) => {
  const twilioConfig = twilioApiClient.validateConfig();

  res.json({
    twilio: twilioConfig,
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

// Start listener
app.listen(port, () => {
  console.log('📱 Twilio WhatsApp Listener started');
  console.log(`📡 Listener running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📩 Twilio webhook: http://localhost:${port}/api/twilio/webhook`);
  console.log(`📁 PDF from folder: http://localhost:${port}/api/process-pdf-folder`);
  console.log(`🖼️ Images served at: http://localhost:${port}/images/:filename`);

  // Validate configuration
  const twilioConfig = twilioApiClient.validateConfig();
  const pdfConfig = pdfToImageService.validateConfig();

  if (!twilioConfig.valid) {
    console.error('❌ Twilio configuration invalid:', twilioConfig.error);
  } else {
    console.log('✅ Twilio configuration valid');
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

// Global error handler to prevent crashes
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
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

