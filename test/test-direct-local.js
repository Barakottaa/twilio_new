const axios = require('axios');

const DIRECT_PROCESSING_URL = 'http://localhost:3002/api/process-pdf';
const PHONE_NUMBER = '+201016666348';

async function testDirectPdfProcessingLocal() {
  console.log('🧪 Testing Direct PDF Processing (Local)');
  console.log('📱 Phone:', PHONE_NUMBER);
  console.log('🌐 Local URL:', DIRECT_PROCESSING_URL);

  try {
    const payload = {
      phoneNumber: PHONE_NUMBER,
      message: 'Please process my PDF document'
    };

    console.log('📤 Sending direct processing request...');
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(DIRECT_PROCESSING_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout for PDF processing
    });

    console.log('✅ Direct processing successful!');
    console.log('📊 Status:', response.status);
    console.log('📋 Response data:', response.data);

    if (response.data.success && response.data.processed) {
      console.log('🎉 PDF processing completed!');
      console.log('📸 Images generated:', response.data.images);
      console.log('📁 Folder:', response.data.folder);
      console.log('📤 Images sent:', response.data.imagesSent);
      console.log('👤 Contact:', response.data.contact);
    } else if (response.data.success) {
      console.log('✅ Request received but no PDF processing');
    } else {
      console.log('❌ Processing failed:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Direct processing failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data || error.message
    });
  }
}

testDirectPdfProcessingLocal();
