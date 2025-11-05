/**
 * PDF to Image Service (Twilio Version)
 * Handles PDF conversion and image processing for Twilio
 */

const fs = require("fs");
const path = require("path");

class PdfToImageService {
  constructor() {
    this.baseDir = process.env.PDF_BASE_DIR || "D:\\Results";
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    try {
      if (!fs.existsSync(this.baseDir)) {
        return {
          valid: false,
          error: `Base directory does not exist: ${this.baseDir}`
        };
      }
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Process PDF from folder based on phone number
   */
  async processPdfFromFolder(phoneNumber) {
    try {
      console.log(`🔄 Processing PDF from folder for phone: ${phoneNumber}`);
      
      // Process the PDF conversion and sending
      const phone = phoneNumber.replace(/[^\d]/g, '');
      const phoneWithPlus = `+${phone}`;
      
      // Find all folders that match the phone number
      const allFolders = fs.readdirSync(this.baseDir);
      const matchingFolders = allFolders.filter(f => f.startsWith(phone) || f.startsWith(phoneWithPlus));
      
      console.log(`🔍 Looking for folder with phone: ${phone} or ${phoneWithPlus}`);
      console.log(`🔍 Available folders:`, allFolders);
      console.log(`🔍 Matching folders:`, matchingFolders);
      
      if (matchingFolders.length === 0) {
        return { 
          success: false, 
          error: "Patient folder not found",
          phoneNumber: phoneNumber
        };
      }
      
      // If multiple folders found, select the most recent one
      let folder;
      if (matchingFolders.length === 1) {
        folder = matchingFolders[0];
        console.log(`📁 Found single folder: ${folder}`);
      } else {
        // Sort by modification time and get the most recent
        const folderStats = matchingFolders.map(folderName => {
          const folderPath = path.join(this.baseDir, folderName);
          const stats = fs.statSync(folderPath);
          return {
            name: folderName,
            mtime: stats.mtime,
            path: folderPath
          };
        });
        
        // Sort by modification time (most recent first)
        folderStats.sort((a, b) => b.mtime - a.mtime);
        folder = folderStats[0].name;
        
        console.log(`📁 Found ${matchingFolders.length} folders for phone ${phoneNumber}`);
        console.log(`📁 Folders by date:`, folderStats.map(f => `${f.name} (${f.mtime.toISOString()})`));
        console.log(`📁 Selected most recent: ${folder}`);
      }
      
      const folderPath = path.join(this.baseDir, folder);
      const pdfFiles = fs.readdirSync(folderPath).filter(f => f.toLowerCase().endsWith('.pdf'));
      
      if (pdfFiles.length === 0) {
        return { 
          success: false, 
          error: "PDF file not found",
          folder: folder
        };
      }
      
      const pdfPath = path.join(folderPath, pdfFiles[0]);
      console.log(`📄 Found PDF: ${pdfFiles[0]}`);
      
      // Convert PDF to images
      const convert = require("pdf-poppler");
      const outputDir = path.join(folderPath, "images");
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      await convert.convert(pdfPath, {
        out_dir: outputDir,
        out_prefix: "تقرير معمل البركة",
        format: "jpeg"
      });
      
      const images = fs.readdirSync(outputDir)
        .filter(f => f.endsWith(".jpg"))
        .map(f => path.basename(f, '.jpg'));
      
      console.log(`📸 Generated ${images.length} images`);
      
      // Send images back to the phone number
      const sendResults = [];
      for (const imageName of images) {
        const imagePath = path.join(outputDir, imageName + '.jpg');
        const sendResult = await this.sendImageToTwilio(phoneNumber, imagePath, imageName);
        sendResults.push({
          image: imageName,
          sent: sendResult.success,
          messageSid: sendResult.messageSid,
          messageId: sendResult.messageSid || sendResult.messageId, // For compatibility
          error: sendResult.error
        });
      }
      
      const successfulSends = sendResults.filter(r => r.sent).length;
      
      return { 
        success: true, 
        message: `PDF converted to ${images.length} images and sent ${successfulSends} to ${phoneNumber}`,
        images: images,
        folder: folder,
        pdfFile: pdfFiles[0],
        imagesSent: successfulSends,
        contact: phoneNumber,
        sendResults: sendResults
      };
      
    } catch (error) {
      console.error("❌ Error processing from folder:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send image via Twilio API
   */
  async sendImageToTwilio(phoneNumber, imagePath, imageName) {
    try {
      console.log(`📤 Sending image ${imageName} to ${phoneNumber} via Twilio API...`);
      
      // Use the Twilio API client to send the image
      const TwilioApiClient = require('./twilio-api-client');
      const twilioApiClient = new TwilioApiClient();
      
      // Get base URL from environment or use default
      // Use the Twilio listener service URL (port 3002) for serving images
      const baseUrl = process.env.NGROK_URL || process.env.PUBLIC_URL || 'http://localhost:3002';
      
      // Send image message using baseUrl for local files
      const sendResult = await twilioApiClient.sendImageMessage(
        phoneNumber, 
        imagePath, 
        `${imageName}`,
        baseUrl
      );
      
      if (sendResult.success) {
        console.log(`✅ Image sent to ${phoneNumber}: ${sendResult.messageSid}`);
        return { 
          success: true, 
          messageSid: sendResult.messageSid,
          messageId: sendResult.messageSid, // For compatibility
          mediaUrl: baseUrl + '/images/' + encodeURIComponent(require('path').basename(imagePath))
        };
      } else {
        throw new Error(`Failed to send image: ${sendResult.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to send image to ${phoneNumber}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup old files
   */
  async cleanupOldFiles(hours = 24) {
    try {
      const now = Date.now();
      const maxAge = hours * 60 * 60 * 1000; // Convert hours to milliseconds

      const folders = fs.readdirSync(this.baseDir);
      
      for (const folder of folders) {
        const folderPath = path.join(this.baseDir, folder);
        const stats = fs.statSync(folderPath);
        
        if (stats.isDirectory() && (now - stats.mtime.getTime()) > maxAge) {
          // Check if folder has images subdirectory
          const imagesPath = path.join(folderPath, 'images');
          if (fs.existsSync(imagesPath)) {
            console.log(`🧹 Cleaning up old folder: ${folder}`);
            fs.rmSync(folderPath, { recursive: true, force: true });
          }
        }
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }
}

module.exports = PdfToImageService;

