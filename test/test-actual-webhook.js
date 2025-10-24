const axios = require('axios');

const BIRD_WEBHOOK_URL = 'http://localhost:8080/bird/api/bird/webhook'; // Proxy routes to Bird service
const PHONE_NUMBER = '+201066101340';

async function testActualWebhook() {
  console.log('🧪 Testing actual webhook format for phone:', PHONE_NUMBER);
  console.log('🌐 Webhook URL:', BIRD_WEBHOOK_URL);

  try {
    const webhookPayload = {
      "id": "de1b62ad-7020-4a23-93dc-bc76fe3b7cc7",
      "channelId": "8e046034-bca7-5124-89d0-1a64c1cbe819",
      "sender": {
        "contact": {
          "id": "2d5a6e69-d9d6-413e-95d2-b1818abd6f03",
          "identifierKey": "phonenumber",
          "identifierValue": PHONE_NUMBER,
          "platformAddressSelector": "identifiers.phonenumber",
          "platformAddress": PHONE_NUMBER,
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
      "context": {},
      "chargeableUnits": 1,
      "lastStatusAt": "2025-10-24T04:13:59.607Z",
      "createdAt": "2025-10-24T04:13:59.483Z",
      "updatedAt": "2025-10-24T04:13:59.607Z",
      "batchId": null
    };

    console.log('📤 Sending actual webhook payload...');
    console.log('📋 Payload structure matches Bird format');

    const response = await axios.post(BIRD_WEBHOOK_URL, webhookPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('✅ Webhook test successful!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Webhook test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data || error.message
    });
    
    if (error.response?.data) {
      console.error('📋 Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testActualWebhook();
