/**
 * Simple script to resend failed messages using PDF_test template
 */

require('dotenv').config();
const PdfToImageService = require('./pdf-to-image-service');

async function resendFailedMessages() {
  console.log('🔄 Resending failed messages with PDF_test template...');
  
  const pdfService = new PdfToImageService();
  
  // TODO: Replace with actual failed message data
  const failedMessages = [
    // Example: { phoneNumber: '+201001234567', pdfUrl: 'https://example.com/failed.pdf' }
  ];
  
  if (failedMessages.length === 0) {
    console.log('ℹ️ No failed messages to resend. Add them to the failedMessages array.');
    return;
  }
  
  console.log(`📊 Found ${failedMessages.length} failed messages to resend`);
  
  for (const message of failedMessages) {
    try {
      console.log(`📤 Resending to ${message.phoneNumber}...`);
      const result = await pdfService.sendPdfWithTemplate(message.phoneNumber, message.pdfUrl);
      
      if (result.success) {
        console.log(`✅ Sent successfully: ${result.messageId}`);
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
      
      // Wait 2 seconds between messages
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error resending to ${message.phoneNumber}:`, error.message);
    }
  }
  
  console.log('✅ Resend process completed!');
}

// Run if called directly
if (require.main === module) {
  resendFailedMessages();
}

module.exports = { resendFailedMessages };
