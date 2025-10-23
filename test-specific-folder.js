const axios = require('axios');

async function testSpecificFolder() {
  try {
    console.log('🧪 Testing PDF-to-image conversion for specific folder...');
    
    const pdfServiceUrl = 'http://localhost:3002/pdf-to-image';
    const testPayload = {
      patient_number: '+201016666348',
      message: 'عايز التقرير في صور'
    };

    console.log('📤 Sending request to PDF service...');
    console.log('📁 Testing folder: +201016666348_2000000390612');
    console.log('📄 Expected PDF: BL-20251023.pdf');
    
    const response = await axios.post(pdfServiceUrl, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    console.log('✅ PDF conversion response:', response.data);
    
    if (response.data.success) {
      console.log(`📸 Generated ${response.data.images.length} images:`);
      response.data.images.forEach((img, index) => {
        console.log(`  ${index + 1}. ${img}`);
      });
    }

  } catch (error) {
    console.error('❌ PDF conversion test failed:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

testSpecificFolder();
