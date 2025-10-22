/**
 * PDF to Image Conversion Service
 * Handles PDF file conversion to images and sending back to Bird
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const pdf = require('pdf-poppler');

class PdfToImageService {
  constructor() {
    this.apiKey = process.env.BIRD_API_KEY;
    this.workspaceId = process.env.BIRD_WORKSPACE_ID;
    this.channelId = process.env.BIRD_CHANNEL_ID;
    this.tempDir = path.join(__dirname, 'temp');
    this.outputDir = path.join(__dirname, 'output');
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    try {
      await fs.ensureDir(this.tempDir);
      await fs.ensureDir(this.outputDir);
      console.log('📁 Directories ensured:', { tempDir: this.tempDir, outputDir: this.outputDir });
    } catch (error) {
      console.error('❌ Failed to create directories:', error.message);
    }
  }

  /**
   * Convert PDF to images
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @param {string} filename - Original filename
   * @returns {Promise<Array>} - Array of image file paths
   */
  async convertPdfToImages(pdfBuffer, filename) {
    try {
      console.log('🔄 Starting PDF to image conversion:', { filename, size: pdfBuffer.length });
      
      // Create unique filename for temp PDF
      const timestamp = Date.now();
      const tempPdfPath = path.join(this.tempDir, `temp_${timestamp}_${filename}`);
      const outputPrefix = path.join(this.outputDir, `converted_${timestamp}`);
      
      // Write PDF buffer to temp file
      await fs.writeFile(tempPdfPath, pdfBuffer);
      console.log('📄 PDF written to temp file:', tempPdfPath);

      // Convert PDF to images using pdf-poppler
      const options = {
        format: 'png',
        out_dir: this.outputDir,
        out_prefix: `converted_${timestamp}`,
        page: null, // Convert all pages
        single_file: false // Create separate files for each page
      };

      console.log('⚙️ Converting PDF with options:', options);
      const result = await pdf.convert(tempPdfPath, options);
      console.log('✅ PDF conversion result:', result);

      // Find all generated image files
      const imageFiles = [];
      const files = await fs.readdir(this.outputDir);
      
      for (const file of files) {
        if (file.startsWith(`converted_${timestamp}`) && file.endsWith('.png')) {
          const fullPath = path.join(this.outputDir, file);
          imageFiles.push(fullPath);
        }
      }

      // Clean up temp PDF file
      await fs.remove(tempPdfPath);
      console.log('🗑️ Cleaned up temp PDF file');

      console.log('🖼️ Generated images:', imageFiles);
      return imageFiles;

    } catch (error) {
      console.error('❌ PDF conversion failed:', error.message);
      throw new Error(`PDF conversion failed: ${error.message}`);
    }
  }

  /**
   * Optimize image for WhatsApp
   * @param {string} imagePath - Path to image file
   * @returns {Promise<string>} - Path to optimized image
   */
  async optimizeImageForWhatsApp(imagePath) {
    try {
      const optimizedPath = imagePath.replace('.png', '_optimized.png');
      
      await sharp(imagePath)
        .resize(1024, 1024, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .png({ 
          quality: 80,
          compressionLevel: 6 
        })
        .toFile(optimizedPath);

      console.log('🔧 Image optimized:', { original: imagePath, optimized: optimizedPath });
      return optimizedPath;
    } catch (error) {
      console.error('❌ Image optimization failed:', error.message);
      return imagePath; // Return original if optimization fails
    }
  }

  /**
   * Send PDF using template instead of images
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} pdfUrl - URL of the PDF file
   * @returns {Promise<Object>} - Response object
   */
  async sendPdfWithTemplate(phoneNumber, pdfUrl) {
    try {
      console.log('📄 Sending PDF with template:', { phoneNumber, pdfUrl });

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
          projectId: process.env.PDF_TEMPLATE_PROJECT_ID || 'b63bd76a-4cc6-463e-9db1-343901ea8dfe',
          version: process.env.PDF_TEMPLATE_VERSION_ID || 'e6cccbe7-863a-4d9f-a651-20863a81e8b3',
          locale: "ar",
          parameters: [pdfUrl] // Pass the PDF URL as parameter
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
          timeout: 30000,
        }
      );

      console.log('✅ PDF sent with template:', {
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
      console.error('❌ Template send failed:', {
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
   * Process PDF webhook from Bird
   * @param {Object} webhookData - Webhook payload
   * @returns {Promise<Object>} - Processing result
   */
  async processPdfWebhook(webhookData) {
    try {
      console.log('📩 Processing PDF webhook:', JSON.stringify(webhookData, null, 2));

      const event = webhookData.event;
      const payload = webhookData.payload;
      
      // Extract contact info and media info
      let contact = null;
      let mediaUrl = null;
      let mediaType = null;
      
      if (event === 'whatsapp.inbound' && payload) {
        contact = payload.sender?.contact?.identifierValue;
        
        // Check for media attachments
        if (payload.body?.document) {
          mediaUrl = payload.body.document.url;
          mediaType = payload.body.document.mimeType;
        } else if (payload.body?.image) {
          mediaUrl = payload.body.image.url;
          mediaType = payload.body.image.mimeType;
        }
      }

      console.log('🔍 Extracted data:', { event, contact, mediaUrl, mediaType });

      // Only process PDF files
      if (mediaType === 'application/pdf' && mediaUrl && contact) {
        console.log('📄 Processing PDF file:', { mediaUrl, contact });
        
        try {
          // Download PDF file
          const pdfResponse = await axios.get(mediaUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000 
          });
          
          const pdfBuffer = Buffer.from(pdfResponse.data);
          console.log('📥 PDF downloaded:', { size: pdfBuffer.length });

          // Convert PDF to images
          const imageFiles = await this.convertPdfToImages(pdfBuffer, 'webhook_pdf.pdf');
          
          if (imageFiles.length === 0) {
            throw new Error('No images generated from PDF');
          }

          console.log('🖼️ Generated images:', imageFiles);

      // Send PDF using template instead of converting to images
      const result = await this.sendPdfWithTemplate(contact, mediaUrl);
      const results = [result];

          console.log('✅ PDF sent successfully with template:', result);

          return {
            success: result.success,
            contact,
            messageId: result.messageId,
            error: result.error
          };

        } catch (error) {
          console.error('❌ PDF processing failed:', error.message);
          
          // Send error message to user
          await this.sendTextMessage(contact, 'عذراً، حدث خطأ في تحويل الملف. يرجى المحاولة مرة أخرى.');
          
          return {
            success: false,
            error: error.message
          };
        }
      } else {
        console.log('ℹ️ Not a PDF file or missing data:', { mediaType, hasUrl: !!mediaUrl, hasContact: !!contact });
        return {
          success: false,
          reason: 'Not a PDF file or missing required data'
        };
      }

    } catch (error) {
      console.error('❌ PDF webhook processing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send text message to contact
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} text - Message text
   * @returns {Promise<Object>} - Response object
   */
  async sendTextMessage(phoneNumber, text) {
    try {
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

      return {
        success: true,
        messageId: response.data.id,
        status: response.data.status,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Text message send failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up old files
   * @param {number} maxAgeHours - Maximum age of files in hours
   */
  async cleanupOldFiles(maxAgeHours = 24) {
    try {
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds

      // Clean up temp directory
      const tempFiles = await fs.readdir(this.tempDir);
      for (const file of tempFiles) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.remove(filePath);
          console.log('🗑️ Cleaned up old temp file:', file);
        }
      }

      // Clean up output directory
      const outputFiles = await fs.readdir(this.outputDir);
      for (const file of outputFiles) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.remove(filePath);
          console.log('🗑️ Cleaned up old output file:', file);
        }
      }

      console.log('🧹 Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  /**
   * Validate service configuration
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
        tempDir: this.tempDir,
        outputDir: this.outputDir
      }
    };
  }
}

module.exports = PdfToImageService;
