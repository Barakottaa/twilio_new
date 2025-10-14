/**
 * Simple Node.js Proxy for Single Ngrok Tunnel
 * Routes requests to different services based on path
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 8080; // Proxy port

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

// Route everything else to main app (port 3000)
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Main app proxy error:', err.message);
    res.status(500).json({ error: 'Main app unavailable' });
  }
}));

app.listen(port, () => {
  console.log(`🔄 Proxy server running on port ${port}`);
  console.log(`📡 Main app: http://localhost:${port}/`);
  console.log(`🕊️ Bird service: http://localhost:${port}/bird/`);
  console.log(`🌐 Use ngrok: ngrok http ${port}`);
});
