const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3004;

// Proxy endpoint that bypasses ngrok warning
app.get('/pdf/:filename', async (req, res) => {
  const filename = req.params.filename;
  const pdfPath = path.join('D:', 'Results', filename);
  
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'PDF file not found' });
  }
  
  try {
    // Read the PDF file directly and serve it
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    res.send(pdfBuffer);
    
    console.log(`✅ Served PDF: ${filename}`);
    
  } catch (error) {
    console.error('Error serving PDF:', error.message);
    res.status(500).json({ error: 'Failed to serve PDF' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'PDF Proxy Server (bypasses ngrok warnings)',
    endpoints: {
      pdf: `http://localhost:${PORT}/pdf/[filename]`,
      list: `http://localhost:${PORT}/list`
    }
  });
});

// List available PDFs
app.get('/list', (req, res) => {
  const resultsDir = 'D:\\Results';
  
  if (!fs.existsSync(resultsDir)) {
    return res.json({ files: [], error: 'Results directory not found' });
  }
  
  const files = fs.readdirSync(resultsDir)
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .map(file => ({
      filename: file,
      directUrl: `http://localhost:${PORT}/pdf/${file}`,
      note: 'This URL bypasses ngrok warnings'
    }));
  
  res.json({ files });
});

app.listen(PORT, () => {
  console.log('🚀 PDF Proxy Server running on port', PORT);
  console.log('📄 Direct PDF access: http://localhost:' + PORT + '/pdf/[filename]');
  console.log('📋 List PDFs: http://localhost:' + PORT + '/list');
  console.log('\n💡 This server serves PDFs directly without ngrok warnings');
  console.log('⏳ Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down PDF proxy server...');
  process.exit(0);
});

