const axios = require('axios');

async function testPdfWithBypass() {
  const pdfUrl = 'https://undegenerated-nonviscidly-marylou.ngrok-free.dev/pdfs/20251017013224.pdf';
  
  console.log('🧪 Testing PDF access with ngrok bypass header...');
  console.log('📄 URL:', pdfUrl);
  
  try {
    const response = await axios.get(pdfUrl, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
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
      console.log('✅ SUCCESS! PDF served directly - ngrok warning bypassed!');
      console.log('🎯 This URL will work in your Bird template');
    } else {
      console.log('❌ Still getting warning page');
      console.log('📄 First 200 characters:', response.data.substring(0, 200));
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.message);
    if (error.response?.data) {
      console.log('📄 Response preview:', error.response.data.substring(0, 200));
    }
  }
}

// Test all available PDFs
async function testAllPdfs() {
  const baseUrl = 'https://undegenerated-nonviscidly-marylou.ngrok-free.dev';
  
  console.log('🧪 Testing all PDFs with bypass header...\n');
  
  const pdfs = [
    '20251017013224.pdf',
    '20251017013227.pdf', 
    '20251017013230.pdf',
    '20251017013235.pdf'
  ];
  
  for (const pdf of pdfs) {
    const url = `${baseUrl}/pdfs/${pdf}`;
    console.log(`📄 Testing: ${pdf}`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/pdf'
        },
        timeout: 5000
      });
      
      if (response.headers['content-type'] === 'application/pdf') {
        console.log(`✅ ${pdf}: SUCCESS - ${response.headers['content-length']} bytes`);
      } else {
        console.log(`❌ ${pdf}: Still getting warning page`);
      }
      
    } catch (error) {
      console.log(`❌ ${pdf}: Error - ${error.message}`);
    }
    
    console.log(''); // Empty line
  }
  
  console.log('🎯 Working PDF URLs for Bird template:');
  pdfs.forEach(pdf => {
    console.log(`   📄 ${pdf}: ${baseUrl}/pdfs/${pdf}`);
  });
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--all')) {
    testAllPdfs();
  } else {
    testPdfWithBypass();
  }
}

module.exports = { testPdfWithBypass, testAllPdfs };

