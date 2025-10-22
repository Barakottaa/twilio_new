const axios = require('axios');

async function testNgrokWarning() {
  const pdfUrl = 'https://undegenerated-nonviscidly-marylou.ngrok-free.dev/pdfs/20251017013224.pdf';
  
  console.log('🧪 Testing ngrok warning page...');
  console.log('📄 URL:', pdfUrl);
  
  try {
    const response = await axios.get(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/pdf, */*'
      },
      maxRedirects: 5,
      timeout: 10000
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Content-Type:', response.headers['content-type']);
    console.log('📊 Content-Length:', response.headers['content-length']);
    
    if (response.headers['content-type'] === 'application/pdf') {
      console.log('✅ PDF served directly - no warning page!');
    } else {
      console.log('❌ Warning page detected - content is not PDF');
      console.log('📄 First 200 characters:', response.data.substring(0, 200));
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.message);
    if (error.response?.data) {
      console.log('📄 Response preview:', error.response.data.substring(0, 200));
    }
  }
}

testNgrokWarning();

