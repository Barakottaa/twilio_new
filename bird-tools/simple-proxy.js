#!/usr/bin/env node

/**
 * Simple Reverse Proxy for Multiple Services
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
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Route Bird service requests to port 3001
app.use('/api/bird', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🕊️  -> Bird service: ${req.method} ${req.path}`);
  }
}));

// Route all other requests to main Twilio server (port 3000)
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🏠 -> Twilio server: ${req.method} ${req.path}`);
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
  console.log('🚀 Simple Reverse Proxy Started');
  console.log(`📡 Port: ${PORT}`);
  console.log('🔀 Routes:');
  console.log('   /api/bird/* -> Bird Service (port 3001)');
  console.log('   /* -> Twilio Server (port 3000)');
  console.log('');
});
