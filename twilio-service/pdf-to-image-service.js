/**
 * PDF to Image Service (Twilio Version)
 * Extends SharedPdfProcessor with Twilio-specific sending logic
 */

const SharedPdfProcessor = require('../shared_utils/pdf-processor');
const TwilioApiClient = require('./twilio-api-client');
const logger = require('../shared_utils/logger')('twilio-pdf-service');
const path = require('path');

class PdfToImageService extends SharedPdfProcessor {
  constructor() {
    super(); // uses default config from env
  }

  /**
   * Process PDF from folder and send via Twilio API
   */
  async processPdfFromFolder(phoneNumber) {
    const twilioApiClient = new TwilioApiClient();

    return this.processPdf(phoneNumber, async (phone, imagePath, imageName) => {
      logger.info(`📤 Sending image ${imageName} to ${phone} via Twilio API...`);

      // Get base URL from environment or use default
      const baseUrl = process.env.NGROK_URL || process.env.PUBLIC_URL || 'http://localhost:3002';

      // Send image message using baseUrl for local files
      const sendResult = await twilioApiClient.sendImageMessage(
        phone,
        imagePath,
        `${imageName}`,
        baseUrl
      );

      if (sendResult.success) {
        logger.info(`✅ Image sent to ${phone}: ${sendResult.messageSid}`);

        // Construct media URL for return value (mirroring previous logic)
        const mediaUrl = baseUrl + '/images/' + encodeURIComponent(path.basename(imagePath));

        return {
          success: true,
          messageSid: sendResult.messageSid,
          messageId: sendResult.messageSid, // For compatibility
          mediaUrl: mediaUrl
        };
      } else {
        throw new Error(`Failed to send image: ${sendResult.error}`);
      }
    });
  }
}

module.exports = PdfToImageService;
