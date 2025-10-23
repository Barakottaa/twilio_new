const axios = require('axios');

async function testWebhookWithLogs() {
  try {
    console.log('🧪 Testing webhook with detailed logging...');
    
    const webhookUrl = 'http://localhost:3000/api/bird/webhook';
    const testPayload = {
      "service": "channels",
      "event": "whatsapp.inbound",
      "payload": {
        "id": "a82577a5-90a4-480b-9810-9c56670544df",
        "channelId": "8e046034-bca7-5124-89d0-1a64c1cbe819",
        "sender": {
          "contact": {
            "id": "6134ace9-615f-4da9-8587-e4a74e7e3fb3",
            "identifierKey": "phonenumber",
            "identifierValue": "+201016666348",
            "annotations": {
              "name": "Abdelrahman Baraka"
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
            "timestamp": "1761177100",
            "user_locale": "ar-EG"
          }
        },
        "reference": "",
        "replyTo": {
          "id": "0bb03f70-fcc2-4795-9b5a-ff02e257c653",
          "order": 0,
          "type": "click"
        },
        "parts": [
          {
            "platformReference": "wamid.HBgMMjAxMDE2NjY2MzQ4FQIAEhgUM0Y0NjhGRDBGNjAzQjlCQThFMkQA"
          }
        ],
        "status": "delivered",
        "reason": "",
        "direction": "incoming",
        "chargeableUnits": 1,
        "lastStatusAt": "2025-10-22T23:51:43.427Z",
        "createdAt": "2025-10-22T23:51:43.352Z",
        "updatedAt": "2025-10-22T23:51:43.427Z",
        "batchId": null
      }
    };

    console.log('📤 Sending webhook request...');
    const response = await axios.post(webhookUrl, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Webhook response:', response.data);
    console.log('📱 Check your WhatsApp for the text message and images!');

  } catch (error) {
    console.error('❌ Webhook test failed:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

testWebhookWithLogs();
