const axios = require('axios');

const BIRD_WEBHOOK_URL = 'http://localhost:3002/api/bird/webhook';
const PHONE_NUMBER = '+201066101340';

async function testThanksPayload() {
  console.log('🧪 Testing "شكرا" (Thanks) Payload');
  console.log('📱 Phone:', PHONE_NUMBER);
  console.log('🌐 Webhook URL:', BIRD_WEBHOOK_URL);

  try {
    const webhookPayload = {
      "service": "channels",
      "event": "whatsapp.inbound",
      "payload": {
        "id": "1ab6a0cb-f01b-4ec3-b589-ce0a8c271d32",
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
            "text": "شكرا",
            "actions": [
              {
                "type": "postback",
                "postback": {
                  "text": "شكرا",
                  "payload": "شكر"
                }
              }
            ]
          }
        },
        "meta": {
          "extraInformation": {
            "timestamp": "1761279223",
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
            "platformReference": "wamid.HBgMMjAxMDY2MTAxMzQwFQIAEhggQUM5RTg2MkIwNDY5QkZBM0FCNkMwN0IwNjlDNzRDNzAA"
          }
        ],
        "status": "delivered",
        "reason": "",
        "direction": "incoming",
        "chargeableUnits": 1,
        "lastStatusAt": "2025-10-24T04:13:46.506Z",
        "createdAt": "2025-10-24T04:13:46.277Z",
        "updatedAt": "2025-10-24T04:13:46.506Z",
        "batchId": null
      }
    };

    console.log('📤 Sending "شكرا" webhook payload...');
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
      timeout: 30000
    });

    console.log('✅ Webhook test successful!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response data:', response.data);

    if (response.data.success) {
      console.log('🎉 Message received and acknowledged!');
      console.log('📝 No special action taken (as expected)');
    }

  } catch (error) {
    console.error('❌ Webhook test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data || error.message
    });
  }
}

testThanksPayload();
