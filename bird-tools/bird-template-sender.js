#!/usr/bin/env node

/**
 * Bird Template Sender - Reusable Function
 * Use this in your other projects to send Bird WhatsApp template messages
 */

const axios = require('axios');

// Configuration - Update these for your project
const BIRD_API_KEY = 'EpYiBbBDjQv6U5oSty2Bxu8Ix5T9XOr9L2fl';
const WORKSPACE_ID = '2d7a1e03-25e4-401e-bf1e-0ace545673d7';
const CHANNEL_ID = '8e046034-bca7-5124-89d0-1a64c1cbe819';

/**
 * Send a Bird WhatsApp template message
 * @param {string} phoneNumber - Recipient phone number (e.g., "+201016666348")
 * @param {string} projectId - Bird template project ID
 * @param {string} templateVersion - Bird template version ID
 * @param {string} locale - Template locale (e.g., "ar", "en")
 * @param {Array} parameters - Template parameters array
 * @returns {Promise<Object>} - Response object with success status and data
 */
async function sendBirdTemplate(phoneNumber, projectId, templateVersion, locale = "ar", parameters = []) {
  try {
    console.log('🕊️ Sending Bird template message...');
    console.log(`   To: ${phoneNumber}`);
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Template Version: ${templateVersion}`);
    console.log(`   Locale: ${locale}`);
    console.log(`   Parameters: ${parameters.length}`);

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
        projectId: projectId,
        version: templateVersion,
        locale: locale,
        parameters: parameters
      }
    };

    const response = await axios.post(
      `https://api.bird.com/workspaces/${WORKSPACE_ID}/channels/${CHANNEL_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `AccessKey ${BIRD_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ Template message sent successfully!');
    console.log(`   Message ID: ${response.data.id}`);
    console.log(`   Status: ${response.data.status}`);

    return {
      success: true,
      messageId: response.data.id,
      status: response.data.status,
      data: response.data
    };

  } catch (error) {
    console.error('❌ Template send failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error('📄 Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`   Error: ${error.message}`);
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

/**
 * Example usage function
 */
async function exampleUsage() {
  // Example 1: Send the invoice template
  const result1 = await sendBirdTemplate(
    "+201016666348", // phone number
    "3c476178-73f1-4eb3-b3a8-e885575fd3be", // project ID
    "6abf0d77-c3cc-448e-a7c2-6b60f272235e", // template version
    "ar", // locale
    [
      { type: "string", key: "patient_name", value: "عبدالرحمن" },
      { type: "string", key: "lab_no", value: "1" },
      { type: "string", key: "total_paid", value: "400" },
      { type: "string", key: "remaining", value: "100" }
    ]
  );

  console.log('Result 1:', result1);

  // Example 2: Send a different template
  const result2 = await sendBirdTemplate(
    "+201016666348",
    "4868dec5-c2fc-4b8e-8612-45dbc3a833c6", // different project ID
    "1bafdb0a-dfb2-4dc8-8a6d-db3f7a456d8e", // different template version
    "en",
    [
      { type: "string", key: "patient_name", value: "عبدالرحمن" },
      { type: "string", key: "total_cost", value: "500" },
      { type: "string", key: "lab_no", value: "1" }
    ]
  );

  console.log('Result 2:', result2);
}

// Export the function for use in other projects
module.exports = { sendBirdTemplate };

// Run example if this file is executed directly
if (require.main === module) {
  console.log('🧪 Running example usage...\n');
  exampleUsage()
    .then(() => {
      console.log('\n✅ Example completed!');
    })
    .catch(error => {
      console.error('\n❌ Example failed:', error);
    });
}
