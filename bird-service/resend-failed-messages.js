/**
 * Resend Failed Messages Script
 * Extracts failed messages from logs and resends them using PDF_test template
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sendPdfWithNewTemplate } = require('./switch-to-pdf-test-template');

/**
 * Parse log files to extract failed messages
 * @param {string} logDir - Directory containing log files
 * @returns {Array} - Array of failed message objects
 */
function extractFailedMessagesFromLogs(logDir = './logs') {
  const failedMessages = [];
  
  try {
    if (!fs.existsSync(logDir)) {
      console.log(`📁 Log directory ${logDir} not found`);
      return failedMessages;
    }
    
    const logFiles = fs.readdirSync(logDir).filter(file => file.endsWith('.log'));
    console.log(`📄 Found ${logFiles.length} log files to analyze`);
    
    for (const logFile of logFiles) {
      const logPath = path.join(logDir, logFile);
      const logContent = fs.readFileSync(logPath, 'utf8');
      
      // Look for failed message patterns in logs
      const failedPatterns = [
        // Pattern 1: PDF processing failed
        /PDF processing failed.*?contact[:\s]+([+\d\s-]+).*?mediaUrl[:\s]+(https?:\/\/[^\s]+)/g,
        // Pattern 2: Image send failed
        /Image send failed.*?phoneNumber[:\s]+([+\d\s-]+).*?error[:\s]+([^}]+)/g,
        // Pattern 3: Template send failed
        /Template send failed.*?phoneNumber[:\s]+([+\d\s-]+).*?error[:\s]+([^}]+)/g
      ];
      
      for (const pattern of failedPatterns) {
        let match;
        while ((match = pattern.exec(logContent)) !== null) {
          const phoneNumber = match[1]?.trim();
          const error = match[2]?.trim();
          
          if (phoneNumber && phoneNumber.match(/^\+?\d{10,15}$/)) {
            failedMessages.push({
              phoneNumber,
              error,
              logFile,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }
    
    console.log(`📊 Extracted ${failedMessages.length} failed messages from logs`);
    return failedMessages;
    
  } catch (error) {
    console.error('❌ Error extracting failed messages from logs:', error.message);
    return failedMessages;
  }
}

/**
 * Get failed messages from Bird API (if available)
 * This would require implementing Bird's message status API
 */
async function getFailedMessagesFromBird() {
  // TODO: Implement Bird API call to get failed messages
  // This would require calling Bird's message status endpoint
  console.log('ℹ️ Bird API failed message retrieval not implemented yet');
  return [];
}

/**
 * Resend a single failed message
 * @param {Object} failedMessage - Failed message object
 * @returns {Promise<Object>} - Resend result
 */
async function resendSingleMessage(failedMessage) {
  try {
    console.log(`📤 Resending to ${failedMessage.phoneNumber}...`);
    
    // For now, we'll need the original PDF URL
    // In a real implementation, you'd store this with the failed message
    const pdfUrl = failedMessage.pdfUrl || 'https://example.com/placeholder.pdf';
    
    const result = await sendPdfWithNewTemplate(failedMessage.phoneNumber, pdfUrl);
    
    return {
      phoneNumber: failedMessage.phoneNumber,
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      originalError: failedMessage.error,
      logFile: failedMessage.logFile
    };
    
  } catch (error) {
    console.error(`❌ Failed to resend to ${failedMessage.phoneNumber}:`, error.message);
    return {
      phoneNumber: failedMessage.phoneNumber,
      success: false,
      error: error.message,
      originalError: failedMessage.error,
      logFile: failedMessage.logFile
    };
  }
}

/**
 * Main resend function
 */
async function resendFailedMessages() {
  console.log('🔄 Starting failed message resend process...');
  console.log('==========================================');
  
  try {
    // Extract failed messages from logs
    console.log('\n1. Extracting failed messages from logs...');
    const failedMessages = extractFailedMessagesFromLogs();
    
    if (failedMessages.length === 0) {
      console.log('ℹ️ No failed messages found in logs');
      return;
    }
    
    console.log(`📊 Found ${failedMessages.length} failed messages to resend`);
    
    // Show failed messages
    console.log('\n📋 Failed Messages:');
    failedMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.phoneNumber} - ${msg.error}`);
    });
    
    // Resend messages
    console.log('\n2. Resending failed messages...');
    const results = [];
    
    for (let i = 0; i < failedMessages.length; i++) {
      const failedMessage = failedMessages[i];
      console.log(`\n📤 Processing ${i + 1}/${failedMessages.length}: ${failedMessage.phoneNumber}`);
      
      const result = await resendSingleMessage(failedMessage);
      results.push(result);
      
      // Add delay between messages to avoid rate limiting
      if (i < failedMessages.length - 1) {
        console.log('⏳ Waiting 2 seconds before next message...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Show results
    console.log('\n📊 Resend Results:');
    console.log('==================');
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`✅ Successfully resent: ${successCount}`);
    console.log(`❌ Failed to resend: ${failureCount}`);
    
    // Show detailed results
    console.log('\n📋 Detailed Results:');
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${index + 1}. ${result.phoneNumber}`);
      if (result.success) {
        console.log(`   Message ID: ${result.messageId}`);
      } else {
        console.log(`   Error: ${result.error}`);
        console.log(`   Original Error: ${result.originalError}`);
      }
    });
    
    // Save results to file
    const resultsFile = `resend-results-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Resend process failed:', error.message);
    throw error;
  }
}

/**
 * Manual resend function for specific phone numbers
 * @param {Array} phoneNumbers - Array of phone numbers to resend
 * @param {string} pdfUrl - PDF URL to send
 */
async function manualResend(phoneNumbers, pdfUrl) {
  console.log('📤 Manual resend for specific phone numbers...');
  console.log('Phone numbers:', phoneNumbers);
  console.log('PDF URL:', pdfUrl);
  
  const results = [];
  
  for (const phoneNumber of phoneNumbers) {
    try {
      console.log(`\n📤 Sending to ${phoneNumber}...`);
      const result = await sendPdfWithNewTemplate(phoneNumber, pdfUrl);
      results.push({
        phoneNumber,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });
      
      // Add delay between messages
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to send to ${phoneNumber}:`, error.message);
      results.push({
        phoneNumber,
        success: false,
        error: error.message
      });
    }
  }
  
  console.log('\n📊 Manual Resend Results:');
  console.table(results);
  
  return results;
}

// Export functions
module.exports = {
  extractFailedMessagesFromLogs,
  resendFailedMessages,
  manualResend,
  resendSingleMessage
};

// Run if called directly
if (require.main === module) {
  resendFailedMessages()
    .then(() => {
      console.log('\n✅ Resend process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Resend process failed:', error.message);
      process.exit(1);
    });
}
