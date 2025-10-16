const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Twilio App...');
console.log('📁 Working directory:', __dirname);

// Check if package.json exists
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'package.json'))) {
  console.error('❌ package.json not found in:', __dirname);
  process.exit(1);
}

const child = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development', PORT: '3000' }
});

child.on('error', (error) => {
  console.error('❌ Error starting Twilio app:', error.message);
  console.error('   Error code:', error.code);
  console.error('   Error path:', error.path);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.log(`🔄 Twilio app killed with signal: ${signal}`);
  } else {
    console.log(`🔄 Twilio app exited with code: ${code}`);
  }
  
  // Only exit with error code if it's not a graceful shutdown
  if (code !== 0 && code !== null) {
    console.error('❌ Twilio app crashed with exit code:', code);
    process.exit(code);
  } else {
    console.log('✅ Twilio app shutdown gracefully');
    process.exit(0);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down Twilio app gracefully...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down Twilio app gracefully...');
  child.kill('SIGTERM');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception in Twilio app:', error);
  child.kill('SIGTERM');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection in Twilio app:', reason);
  child.kill('SIGTERM');
  process.exit(1);
});
