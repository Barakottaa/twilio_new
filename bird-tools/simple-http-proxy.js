#!/usr/bin/env node

/**
 * Simple HTTP Proxy using Node.js built-in modules
 * Routes requests to both Twilio server (port 3000) and Bird service (port 3001)
 */

const http = require('http');
const httpProxy = require('http-proxy');

const PORT = 3002;

// Create proxy instances
const twilioProxy = httpProxy.createProxyServer({
  target: 'http://localhost:3000',
  changeOrigin: true
});

const birdProxy = httpProxy.createProxyServer({
  target: 'http://localhost:3001',
  changeOrigin: true
});

// Create server
const server = http.createServer((req, res) => {
  console.log(`📥 ${req.method} ${req.path}`);
  
  // Route Bird service requests
  if (req.url.startsWith('/api/bird')) {
    console.log(`🕊️  -> Bird service: ${req.method} ${req.path}`);
    birdProxy.web(req, res);
    return;
  }
  
  // Route all other requests to Twilio server
  console.log(`🏠 -> Twilio server: ${req.method} ${req.path}`);
  twilioProxy.web(req, res);
});

// Handle proxy errors
twilioProxy.on('error', (err, req, res) => {
  console.error('❌ Twilio proxy error:', err.message);
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Twilio service unavailable' }));
});

birdProxy.on('error', (err, req, res) => {
  console.error('❌ Bird proxy error:', err.message);
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Bird service unavailable' }));
});

// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        twilio: 'http://localhost:3000',
        bird: 'http://localhost:3001'
      }
    }));
    return;
  }
});

server.listen(PORT, () => {
  console.log('🚀 Simple HTTP Proxy Started');
  console.log(`📡 Port: ${PORT}`);
  console.log('🔀 Routes:');
  console.log('   /api/bird/* -> Bird Service (port 3001)');
  console.log('   /* -> Twilio Server (port 3000)');
  console.log('   /health -> Health check');
  console.log('');
});
