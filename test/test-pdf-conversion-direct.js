const axios = require('axios');

async function testPDFConversionDirect() {
  console.log('🧪 Testing PDF to image conversion directly...');
  
  const pdfServiceUrl = 'http://localhost:3002/pdf-to-image';
  const patientNumber = '+201000209206';
  const message = 'Please process this PDF document';
  
  const payload = {
    patient_number: patientNumber,
    message: message
  };
  
  console.log('📤 Sending request to PDF service...');
  console.log('👤 Patient:', patientNumber);
  console.log('📝 Message:', message);
  console.log('🌐 Service URL:', pdfServiceUrl);
  
  try {
    const response = await axios.post(pdfServiceUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout for PDF processing
    });
    
    console.log('✅ PDF conversion response:', response.status, response.statusText);
    console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ PDF conversion failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run the test
testPDFConversionDirect().catch(console.error);
