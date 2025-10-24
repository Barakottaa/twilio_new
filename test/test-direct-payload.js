const axios = require('axios');

const BIRD_WEBHOOK_URL = 'http://localhost:3002/api/bird/webhook';
const PHONE_NUMBER = '+201004331262';

async function testDirectPayload() {
  console.log('🧪 Testing Direct Payload (No wrapper)');
  console.log('📱 Phone:', PHONE_NUMBER);
  console.log('🌐 Webhook URL:', BIRD_WEBHOOK_URL);

  try {
    const webhookPayload = {
      "id": "7b9ef840-361f-4aee-9fbb-8c870ceaa620",
      "channelId": "8e046034-bca7-5124-89d0-1a64c1cbe819",
      "sender": {
        "contact": {
          "id": "40d5c607-d73d-4d39-bc7f-5416cdb61ee8",
          "identifierKey": "phonenumber",
          "identifierValue": "+201004331262",
          "platformAddressSelector": "identifiers.phonenumber",
          "platformAddress": "+201004331262",
          "annotations": {
            "name": "."
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
          "timestamp": "1761266478",
          "user_locale": "ar-EG"
        }
      },
      "reference": "",
      "replyTo": {
        "id": "13d1a51f-48af-4d0c-ab7c-ef3f8ec267bd",
        "order": 0,
        "type": "click"
      },
      "parts": [
        {
          "platformReference": "wamid.HBgMMjAxMDA0MzMxMjYyFQIAEhggQUM4MDlGQ0QxMEU0QTU2QUExNjg1MTVBN0Y2QTFCNjUA"
        }
      ],
      "status": "delivered",
      "reason": "",
      "direction": "incoming",
      "context": {},
      "chargeableUnits": 1,
      "lastStatusAt": "2025-10-24T00:41:22.522Z",
      "createdAt": "2025-10-24T00:41:22.23Z",
      "updatedAt": "2025-10-24T00:41:22.522Z",
      "batchId": null
    };

    console.log('📤 Sending direct payload...');
    console.log('📋 Payload structure:', {
      hasEvent: !!webhookPayload.event,
      hasPayload: !!webhookPayload.payload,
      phone: webhookPayload.sender.contact.identifierValue,
      text: webhookPayload.body.text.text,
      postback: webhookPayload.body.text.actions[0].postback.payload
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
    } else if (response.data.success) {
      console.log('✅ Message received but no PDF processing');
    }

  } catch (error) {
    console.error('❌ Webhook test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data || error.message
    });
  }
}

testDirectPayload();
