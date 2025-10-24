const axios = require('axios');

async function testWebhookWithRealPDF() {
  console.log('🧪 Testing complete webhook workflow with real PDF...');
  
  const webhookUrl = 'http://localhost:8080/bird/api/bird/webhook';
  const pdfPath = 'D:\\Results\\+201000209206_393552\\BL-20251022.pdf';
  
  // Simulate a WhatsApp webhook payload that would trigger PDF processing
  const webhookPayload = {
    "event": "message.received",
    "data": {
      "id": "test-message-123",
      "channel": {
        "id": "test-channel-456"
      },
      "contact": {
        "phone": "+201000209206",
        "name": "Test Patient"
      },
      "message": {
        "id": "msg-123",
        "type": "document",
        "content": {
          "filename": "BL-20251022.pdf",
          "mime_type": "application/pdf",
          "url": `http://localhost:8080/pdfs/+201000209206_393552/BL-20251022.pdf`
        },
        "timestamp": new Date().toISOString()
      }
    }
  };
  
  console.log('📤 Sending webhook payload to Bird service...');
  console.log('📄 PDF file:', pdfPath);
  console.log('🌐 PDF URL:', webhookPayload.data.message.content.url);
  
  try {
    const response = await axios.post(webhookUrl, webhookPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('✅ Webhook response:', response.status, response.statusText);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Webhook test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run the test
testWebhookWithRealPDF().catch(console.error);
