const { spawn } = require('child_process');
const path = require('path');

console.log('🕊️ Starting Bird Service...');
console.log('📁 Working directory:', __dirname);

// Check if server.js exists
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'server.js'))) {
  console.error('❌ server.js not found in:', __dirname);
  process.exit(1);
}

// Check if .env exists
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.warn('⚠️ .env file not found, using default environment');
}

const child = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'production', PORT: '3001' }
});

child.on('error', (error) => {
  console.error('❌ Error starting Bird service:', error.message);
  console.error('   Error code:', error.code);
  console.error('   Error path:', error.path);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.log(`🔄 Bird service killed with signal: ${signal}`);
  } else {
    console.log(`🔄 Bird service exited with code: ${code}`);
  }
  
  // Only exit with error code if it's not a graceful shutdown
  if (code !== 0 && code !== null) {
    console.error('❌ Bird service crashed with exit code:', code);
    process.exit(code);
  } else {
    console.log('✅ Bird service shutdown gracefully');
    process.exit(0);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down Bird service gracefully...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down Bird service gracefully...');
  child.kill('SIGTERM');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception in Bird service:', error);
  child.kill('SIGTERM');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection in Bird service:', reason);
  child.kill('SIGTERM');
  process.exit(1);
});
