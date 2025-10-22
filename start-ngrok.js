const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ngrok tunnel...');

// Check if ngrok is authenticated
const checkAuth = () => {
  return new Promise((resolve) => {
    const authCheck = spawn('ngrok', ['config', 'check'], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    authCheck.stdout.on('data', (data) => {
      output += data.toString();
    });

    authCheck.stderr.on('data', (data) => {
      output += data.toString();
    });

    authCheck.on('close', (code) => {
      resolve(code === 0);
    });
  });
};

// Start ngrok tunnel
const startNgrok = async () => {
  try {
    console.log('🌐 Starting ngrok tunnel on port 8080...');

    const ngrok = spawn('ngrok', ['http', '8080', '--log=stdout'], {
      stdio: 'inherit',
      shell: true
    });

    ngrok.on('error', (error) => {
      console.error('❌ Failed to start ngrok:', error.message);
      process.exit(1);
    });

    ngrok.on('close', (code) => {
      console.log(`🔄 Ngrok process exited with code ${code}`);
      if (code !== 0) {
        console.log('⚠️ Ngrok exited unexpectedly, will be restarted by PM2');
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('🛑 Shutting down ngrok...');
      ngrok.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('🛑 Shutting down ngrok...');
      ngrok.kill('SIGTERM');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error starting ngrok:', error);
    process.exit(1);
  }
};

startNgrok();