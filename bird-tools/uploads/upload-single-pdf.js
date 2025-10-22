const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

async function uploadPdf(pdfPath) {
  // Use command line argument or default path
  const filePath = pdfPath || 'D:\\Results\\20251012010240.pdf';
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ PDF file not found:', filePath);
    console.log('💡 Usage: node upload-single-pdf.js [path-to-pdf]');
    return;
  }
  
  const fileName = path.basename(filePath);
  console.log('📁 Found PDF:', filePath);
  
  try {
    // Copy file to public-pdfs directory
    const publicPdfPath = path.join(__dirname, 'public-pdfs', fileName);
    fs.copyFileSync(filePath, publicPdfPath);
    console.log('📋 Copied to public directory:', publicPdfPath);
    
    // Get current ngrok URL
    console.log('\n🔍 Getting current ngrok URL...');
    const ngrokResponse = await axios.get('http://localhost:4040/api/tunnels');
    const tunnels = ngrokResponse.data.tunnels;
    
    if (tunnels.length > 0) {
      const publicUrl = tunnels[0].public_url;
      const publicPdfUrl = `${publicUrl}/pdfs/${fileName}`;
      
      console.log('\n🌐 Public ngrok URL:', publicUrl);
      console.log('📄 Public PDF URL:', publicPdfUrl);
      console.log('\n🎯 You can now use this URL in your Bird template:');
      console.log(`   ${publicPdfUrl}`);
      
      // Test if file is accessible
      try {
        const testResponse = await axios.head(publicPdfUrl);
        console.log('✅ File is accessible via public URL');
        console.log(`📊 File size: ${testResponse.headers['content-length']} bytes`);
      } catch (testError) {
        console.log('⚠️  File uploaded but may not be immediately accessible');
      }
      
    } else {
      console.log('❌ No active ngrok tunnels found');
      console.log('💡 Make sure ngrok is running: pm2 start ecosystem.config.js');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get file path from command line arguments
const filePath = process.argv[2];
uploadPdf(filePath);
