#!/usr/bin/env node

/**
 * Reverse Proxy for Multiple Services
 * Routes requests to both Twilio server (port 3000) and Bird service (port 3001)
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3002;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} -> ${req.get('host')}`);
  next();
});

// Route Bird service requests to port 3001
app.use('/api/bird', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/bird': '/api/bird' // Keep the /api/bird prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🕊️  Proxying to Bird service: ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    console.error(`❌ Bird proxy error:`, err.message);
    res.status(500).json({ error: 'Bird service unavailable' });
  }
}));

// Route all other requests to main Twilio server (port 3000)
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🏠 Proxying to Twilio server: ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    console.error(`❌ Twilio proxy error:`, err.message);
    res.status(500).json({ error: 'Twilio service unavailable' });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      twilio: 'http://localhost:3000',
      bird: 'http://localhost:3001'
    }
  });
});

app.listen(PORT, () => {
  console.log('🚀 Reverse Proxy Server Started');
  console.log(`📡 Listening on port ${PORT}`);
  console.log('🔀 Routing:');
  console.log('   /api/bird/* -> http://localhost:3001 (Bird Service)');
  console.log('   /* -> http://localhost:3000 (Twilio Server)');
  console.log('   /health -> Health check');
  console.log('');
  console.log('🌐 Ngrok should point to this proxy server');
});
