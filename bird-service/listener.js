/**
 * Bird WhatsApp Listener
 * Receives requests from Bird workflow and handles PDF to image conversion
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');

// Import services
const PdfToImageService = require('./pdf-to-image-service');
const BirdApiClient = require('./bird-api-client');
const logger = require('../shared_utils/logger')('bird-service');

const app = express();
const port = process.env.PORT || 3001;

// Initialize services
const pdfToImageService = new PdfToImageService();
const birdApiClient = new BirdApiClient();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'bird-service',
    services: {
      bird: birdApiClient.validateConfig().valid,
      pdfToImage: pdfToImageService.validateConfig().valid
    }
  });
});

// Bird webhook endpoint - processes patient requests and converts PDFs to images
app.post('/api/bird/webhook', async (req, res) => {
  try {
    logger.info('📩 [listener] Received Bird webhook request', req.body);

    // Extract patient phone number from the request (handle multiple formats)
    let phoneNumber, message;

    // Format 1: Direct structure - req.body.sender.contact.identifierValue
    if (req.body.sender?.contact?.identifierValue) {
      phoneNumber = req.body.sender.contact.identifierValue;
      message = req.body.body?.text?.text;
    }
    // Format 2: Nested payload structure - req.body.payload.sender.contact.identifierValue
    else if (req.body.payload?.sender?.contact?.identifierValue) {
      phoneNumber = req.body.payload.sender.contact.identifierValue;
      message = req.body.payload.body?.text?.text;
    }
    // Format 3: New Bird webhook format - req.body.payload.sender.contact[0].identifierValue
    else if (req.body.payload?.sender?.contact?.[0]?.identifierValue) {
      phoneNumber = req.body.payload.sender.contact[0].identifierValue;
      message = req.body.payload.body?.text?.text;
    }

    logger.info('🔍 [listener] Extracted data from request', { phoneNumber, message });

    if (!phoneNumber) {
      logger.warn('❌ [listener] No phone number found in request');
      return res.json({
        success: false,
        error: 'No phone number found in request'
      });
    }

    // Check if this is a request for images (PDF conversion)
    if (message?.toLowerCase().includes('image')) {
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
            console.log('❌ [background] PDF conversion failed:', result.error);
          }
        } catch (error) {
          console.log('❌ [background] PDF processing error:', error.message);
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
    logger.error('❌ Bird webhook error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});


// Configuration validation endpoint
app.get('/api/config', (req, res) => {
  const birdConfig = birdApiClient.validateConfig();

  res.json({
    bird: birdConfig,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('❌ Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start listener
app.listen(port, () => {
  console.log('🕊️ Bird WhatsApp Listener started');
  console.log(`📡 Listener running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📩 Bird webhook: http://localhost:${port}/api/bird/webhook`);
  console.log(`📁 PDF from folder: http://localhost:${port}/api/process-pdf-folder`);

  // Validate configuration
  const birdConfig = birdApiClient.validateConfig();
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
      logger.error('❌ Scheduled cleanup failed:', error.message);
    }
  }, 60 * 60 * 1000); // 1 hour
});



// Process PDF from folder endpoint
app.post('/api/process-pdf-folder', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber is required' });
    }

    console.log('📄 Processing PDF from folder for:', phoneNumber);

    const result = await pdfToImageService.processPdfFromFolder(phoneNumber);
    res.json(result);
  } catch (error) {
    console.error('❌ PDF processing error:', error.message);
    res.status(500).json({ error: error.message });
  }
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
