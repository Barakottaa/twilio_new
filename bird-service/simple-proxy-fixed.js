/**
 * Simple Node.js Proxy for Single Ngrok Tunnel
 * Routes requests to different services based on path
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 8080; // Proxy port

// Middleware
app.use(express.json());

// Test route to verify proxy is working
app.get('/test-proxy', (req, res) => {
  res.json({ message: 'Proxy is working!', timestamp: new Date().toISOString() });
});

// Serve PDF files from D:\Results
app.get('/pdfs/:filename', (req, res) => {
  const filename = req.params.filename;
  const pdfPath = path.join('D:', 'Results', filename);
  
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'PDF file not found' });
  }
  
  // Set headers to bypass ngrok warning page
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('ngrok-skip-browser-warning', 'true');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  res.sendFile(path.resolve(pdfPath));
});

// List available PDFs
app.get('/pdfs', (req, res) => {
  const resultsDir = 'D:\\Results';
  
  if (!fs.existsSync(resultsDir)) {
    return res.json({ files: [], error: 'Results directory not found' });
  }
  
  const files = fs.readdirSync(resultsDir)
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .map(file => ({
      filename: file,
      url: `https://undegenerated-nonviscidly-marylou.ngrok-free.dev/pdfs/${file}`
    }));
  
  res.json({ files });
});

// Route /api/process-pdf to Bird listener (port 3001) - Direct processing
app.use('/api/process-pdf', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔄 Proxying direct PDF processing request to port 3001:', req.method, req.url);
  },
  onError: (err, req, res) => {
    console.error('Bird direct PDF processing proxy error:', err.message);
    res.status(500).json({ error: 'Bird PDF processing service unavailable' });
  }
}));

// Route /api/bird/webhook to Bird listener (port 3001)
app.use('/api/bird/webhook', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔄 Proxying webhook request to port 3001:', req.method, req.url);
  },
  onError: (err, req, res) => {
    console.error('Bird webhook service proxy error:', err.message);
    res.status(500).json({ error: 'Bird webhook service unavailable' });
  }
}));

// Route /bird/* to Bird service (port 3001)
app.use('/bird', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/bird': '', // Remove /bird prefix
  },
  onError: (err, req, res) => {
    console.error('Bird service proxy error:', err.message);
    res.status(500).json({ error: 'Bird service unavailable' });
  }
}));

// Route everything else to main app (port 3000) - MUST BE LAST
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Main app proxy error:', err.message);
    res.status(500).json({ error: 'Main app unavailable' });
  }
}));

app.listen(port, () => {
  console.log(`🔄 Reverse Proxy server running on port ${port}`);
  console.log(`📡 Main app: http://localhost:${port}/`);
  console.log(`🕊️ Bird listener: http://localhost:${port}/bird/`);
  console.log(`🐦 Bird webhook: http://localhost:${port}/api/bird/webhook`);
  console.log(`📄 PDF processing: http://localhost:${port}/api/process-pdf`);
  console.log(`📁 PDF files: http://localhost:${port}/pdfs/`);
  console.log(`🌐 Use ngrok: ngrok http ${port}`);
  console.log(`\n💡 Start services in this order:`);
  console.log(`   1. npm start (in bird-service/)`);
  console.log(`   2. node simple-proxy-fixed.js`);
  console.log(`   3. ngrok http ${port}`);
});
