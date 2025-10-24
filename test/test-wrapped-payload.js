const axios = require('axios');

const BIRD_WEBHOOK_URL = 'http://localhost:3002/api/bird/webhook';
const PHONE_NUMBER = '+201016666348';

async function testWrappedPayload() {
  console.log('🧪 Testing Wrapped Payload Format');
  console.log('📱 Phone:', PHONE_NUMBER);
  console.log('🌐 Webhook URL:', BIRD_WEBHOOK_URL);

  try {
    const webhookPayload = {
      "service": "channels",
      "event": "whatsapp.inbound",
      "payload": {
        "id": "32db9210-ca72-410c-b8c0-7df31d6a6c2e",
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
            "timestamp": "1761311290",
            "user_locale": "ar-EG"
          }
        },
        "reference": "",
        "replyTo": {
          "id": "5c319390-6fa3-4791-bbba-08b81f69e01b",
          "order": 0,
          "type": "click"
        },
        "parts": [
          {
            "platformReference": "wamid.HBgMMjAxMDE2NjY2MzQ4FQIAEhgUM0ZERjA2MzE1RERDMkY3RUVCNEEA"
          }
        ],
        "status": "delivered",
        "reason": "",
        "direction": "incoming",
        "chargeableUnits": 1,
        "lastStatusAt": "2025-10-24T13:08:11.915Z",
        "createdAt": "2025-10-24T13:08:11.844Z",
        "updatedAt": "2025-10-24T13:08:11.915Z",
        "batchId": null
      }
    };

    console.log('📤 Sending wrapped payload...');
    console.log('📋 Payload structure:', {
      service: webhookPayload.service,
      event: webhookPayload.event,
      phone: webhookPayload.payload.sender.contact.identifierValue,
      name: webhookPayload.payload.sender.contact.annotations.name,
      text: webhookPayload.payload.body.text.text,
      postback: webhookPayload.payload.body.text.actions[0].postback.payload
    });

    const response = await axios.post(BIRD_WEBHOOK_URL, webhookPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Webhook test successful!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response data:', response.data);

    if (response.data.success && response.data.processed) {
      console.log('🎉 PDF processing triggered!');
      console.log('📸 Images:', response.data.images);
      console.log('📁 Folder:', response.data.folder);
      console.log('📤 Images sent:', response.data.imagesSent);
    } else if (response.data.success) {
      console.log('✅ Message received but no PDF processing');
    } else {
      console.log('❌ Processing failed:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Webhook test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data || error.message
    });
    
    if (error.response?.status === 404) {
      console.log('💡 404 Error - Webhook endpoint not found');
      console.log('🔧 Check if bird-webhook-service is running on port 3002');
    }
  }
}

testWrappedPayload();
