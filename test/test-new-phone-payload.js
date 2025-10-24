const axios = require('axios');

const BIRD_WEBHOOK_URL = 'http://localhost:3002/api/bird/webhook';
const PHONE_NUMBER = '+201226728934';

async function testNewPhonePayload() {
  console.log('🧪 Testing New Phone Number Payload');
  console.log('📱 Phone:', PHONE_NUMBER);
  console.log('🌐 Webhook URL:', BIRD_WEBHOOK_URL);

  try {
    const webhookPayload = {
      "id": "874081c3-44a5-488a-92c5-256a5973294b",
      "channelId": "8e046034-bca7-5124-89d0-1a64c1cbe819",
      "sender": {
        "contact": {
          "id": "01a9c956-d2b3-472b-b338-d4a92a622ba8",
          "identifierKey": "phonenumber",
          "identifierValue": "+201226728934",
          "platformAddressSelector": "identifiers.phonenumber",
          "platformAddress": "+201226728934",
          "annotations": {
            "name": "t97926863ابواحمد"
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
          "timestamp": "1761257282",
          "user_locale": "ar-EG"
        }
      },
      "reference": "",
      "replyTo": {
        "id": "a011ebc1-b12d-44ff-84b3-cc01d19239f1",
        "order": 0,
        "type": "click"
      },
      "parts": [
        {
          "platformReference": "wamid.HBgMMjAxMjI2NzI4OTM0FQIAEhggQUNCRjRFNTA2RjkzQjIyQzZBOUJGRDA1QzNGNjYwQUIA"
        }
      ],
      "status": "delivered",
      "reason": "",
      "direction": "incoming",
      "context": {},
      "chargeableUnits": 1,
      "lastStatusAt": "2025-10-23T22:08:05.27Z",
      "createdAt": "2025-10-23T22:08:05.154Z",
      "updatedAt": "2025-10-23T22:08:05.27Z",
      "batchId": null
    };

    console.log('📤 Sending new phone number payload...');
    console.log('📋 Payload structure:', {
      phone: webhookPayload.sender.contact.identifierValue,
      name: webhookPayload.sender.contact.annotations.name,
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
  }
}

testNewPhonePayload();
