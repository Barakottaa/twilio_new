/**
 * PDF to Image Service (Bird Version)
 * Extends SharedPdfProcessor with Bird-specific sending logic
 */

const SharedPdfProcessor = require('../shared_utils/pdf-processor');
const BirdApiClient = require('./bird-api-client');
const logger = require('../shared_utils/logger')('bird-pdf-service');

class PdfToImageService extends SharedPdfProcessor {
  constructor() {
    super(); // uses default config from env
  }

  /**
   * Process PDF from folder and send via Bird API
   */
  async processPdfFromFolder(phoneNumber) {
    const birdApiClient = new BirdApiClient();

    return this.processPdf(phoneNumber, async (phone, imagePath, imageName) => {
      logger.info(`📤 Sending image ${imageName} to ${phone} via Bird API...`);

      // Upload image
      const uploadResult = await birdApiClient.uploadImage(imagePath);
      if (!uploadResult.success) {
        throw new Error(`Failed to upload image: ${uploadResult.error}`);
      }

      // Send image message
      const sendResult = await birdApiClient.sendImageMessage(
        phone,
        uploadResult.mediaUrl,
        `${imageName}`
      );

      if (sendResult.success) {
        logger.info(`✅ Image sent to ${phone}: ${sendResult.messageId}`);
        return {
          success: true,
          messageId: sendResult.messageId,
          mediaUrl: uploadResult.mediaUrl
        };
      } else {
        throw new Error(`Failed to send image: ${sendResult.error}`);
      }
    });
  }
}

module.exports = PdfToImageService;