const axios = require('axios');

const BIRD_WEBHOOK_URL = 'http://localhost:3002/api/bird/webhook'; // Bird Webhook Service
const PHONE_NUMBER = '+201066101340';

async function testBirdWebhookExact() {
  console.log('🧪 Testing Bird Webhook with Exact Payload');
  console.log('📱 Phone:', PHONE_NUMBER);
  console.log('🌐 Webhook URL:', BIRD_WEBHOOK_URL);

  try {
    const webhookPayload = {
      "service": "channels",
      "event": "whatsapp.inbound",
      "payload": {
        "id": "de1b62ad-7020-4a23-93dc-bc76fe3b7cc7",
        "channelId": "8e046034-bca7-5124-89d0-1a64c1cbe819",
        "sender": {
          "contact": {
            "id": "2d5a6e69-d9d6-413e-95d2-b1818abd6f03",
            "identifierKey": "phonenumber",
            "identifierValue": "+201066101340",
            "annotations": {
              "name": "\"Malek&karma&Hamza\""
            }
          }
        },
        "receiver": {
          "connector": {
            "id": "4128432e-797f-4d1e-a240-98a6866890c3",
            "identifierValue": "+201100414204"
          }
        },
        "body": {
          "type": "text",
          "text": {
            "text": "عايز التقرير في صور",
            "actions": [
              {
                "type": "postback",
                "postback": {
                  "text": "عايز التقرير في صور",
                  "payload": "Image"
                }
              }
            ]
          }
        },
        "meta": {
          "extraInformation": {
            "timestamp": "1761279236",
            "user_locale": "ar-EG"
          }
        },
        "reference": "",
        "replyTo": {
          "id": "27b82c5c-f8a7-43d7-b26b-2e808c4ae003",
          "order": 0,
          "type": "click"
        },
        "parts": [
          {
            "platformReference": "wamid.HBgMMjAxMDY2MTAxMzQwFQIAEhggQUM5RDVEMEIyMDk0NkFDMTA0N0FDRTUwREY3OTgyQjUA"
          }
        ],
        "status": "delivered",
        "reason": "",
        "direction": "incoming",
        "chargeableUnits": 1,
        "lastStatusAt": "2025-10-24T04:13:59.607Z",
        "createdAt": "2025-10-24T04:13:59.483Z",
        "updatedAt": "2025-10-24T04:13:59.607Z",
        "batchId": null
      }
    };

    console.log('📤 Sending exact webhook payload...');
    console.log('📋 Payload structure:', {
      service: webhookPayload.service,
      event: webhookPayload.event,
      phone: webhookPayload.payload.sender.contact.identifierValue,
      text: webhookPayload.payload.body.text.text,
      postback: webhookPayload.payload.body.text.actions[0].postback.payload
    });

    const response = await axios.post(BIRD_WEBHOOK_URL, webhookPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout for PDF processing
    });

    console.log('✅ Webhook test successful!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response data:', response.data);

    if (response.data.success) {
      console.log('🎉 Webhook processed successfully!');
      if (response.data.processed) {
        console.log('📄 PDF processing completed');
        console.log('📸 Images:', response.data.images);
        console.log('📁 Folder:', response.data.folder);
      }
    }

  } catch (error) {
    console.error('❌ Webhook test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data || error.message
    });
    
    if (error.response?.status === 404) {
      console.log('💡 Tip: Make sure the Bird Webhook Service is running on port 3002');
    }
  }
}

testBirdWebhookExact();
