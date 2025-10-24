#!/usr/bin/env node

/**
 * Ngrok Tunnel Starter
 * Creates a public tunnel for the Bird listener service
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Ngrok tunnel...');

// Start ngrok tunnel for port 3001 (Bird listener)
const ngrok = spawn('ngrok', ['http', '3001'], {
  stdio: 'inherit',
  shell: true
});

ngrok.on('error', (error) => {
  console.error('❌ Ngrok error:', error.message);
  process.exit(1);
});

ngrok.on('close', (code) => {
  console.log(`🔄 Ngrok process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('🛑 Stopping ngrok tunnel...');
  ngrok.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Stopping ngrok tunnel...');
  ngrok.kill('SIGTERM');
  process.exit(0);
});

console.log('✅ Ngrok tunnel started on port 3001');
console.log('📡 Public URL will be available at: https://dashboard.ngrok.com/status/tunnels');
