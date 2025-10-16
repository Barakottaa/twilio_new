const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing services before PM2 start...\n');

const checks = [];

// Check if required files exist
const checkFiles = () => {
  const requiredFiles = [
    'start-twilio.js',
    'bird-service-package/start-bird.js',
    'bird-service-package/simple-proxy.js',
    'start-ngrok.js',
    'ecosystem.config.js'
  ];

  console.log('📁 Checking required files...');
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      checks.push(false);
    }
  });
};

// Check if ports are available
const checkPorts = () => {
  return new Promise((resolve) => {
    console.log('\n🔌 Checking port availability...');
    const ports = [3000, 3001, 8080];
    let availablePorts = 0;

    const checkPort = (port) => {
      return new Promise((portResolve) => {
        const netstat = spawn('netstat', ['-ano'], { stdio: 'pipe' });
        let output = '';

        netstat.stdout.on('data', (data) => {
          output += data.toString();
        });

        netstat.on('close', () => {
          const isInUse = output.includes(`:${port}`);
          if (isInUse) {
            console.log(`❌ Port ${port} - IN USE`);
            portResolve(false);
          } else {
            console.log(`✅ Port ${port} - AVAILABLE`);
            portResolve(true);
          }
        });
      });
    };

    Promise.all(ports.map(checkPort)).then(results => {
      availablePorts = results.filter(Boolean).length;
      resolve(availablePorts === ports.length);
    });
  });
};

// Check environment variables
const checkEnvironment = () => {
  console.log('\n🔧 Checking environment variables...');
  
  // Check .env.local
  if (fs.existsSync('.env.local')) {
    console.log('✅ .env.local exists');
    const envContent = fs.readFileSync('.env.local', 'utf8');
    if (envContent.includes('BIRD_API_KEY')) {
      console.log('✅ BIRD_API_KEY found in .env.local');
    } else {
      console.log('❌ BIRD_API_KEY missing in .env.local');
      checks.push(false);
    }
  } else {
    console.log('❌ .env.local missing');
    checks.push(false);
  }

  // Check bird-service-package/.env
  if (fs.existsSync('bird-service-package/.env')) {
    console.log('✅ bird-service-package/.env exists');
    const envContent = fs.readFileSync('bird-service-package/.env', 'utf8');
    if (envContent.includes('BIRD_API_KEY')) {
      console.log('✅ BIRD_API_KEY found in bird-service-package/.env');
    } else {
      console.log('❌ BIRD_API_KEY missing in bird-service-package/.env');
      checks.push(false);
    }
  } else {
    console.log('❌ bird-service-package/.env missing');
    checks.push(false);
  }
};

// Check ngrok authentication
const checkNgrok = () => {
  return new Promise((resolve) => {
    console.log('\n🌐 Checking ngrok authentication...');
    
    const ngrok = spawn('ngrok.exe', ['config', 'check'], { 
      stdio: 'pipe',
      shell: true 
    });

    let output = '';
    ngrok.stdout.on('data', (data) => {
      output += data.toString();
    });

    ngrok.stderr.on('data', (data) => {
      output += data.toString();
    });

    ngrok.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Ngrok is authenticated');
        resolve(true);
      } else {
        console.log('❌ Ngrok is not authenticated');
        console.log('💡 Run: ngrok config add-authtoken YOUR_TOKEN');
        resolve(false);
      }
    });
  });
};

// Main diagnostic function
const runDiagnostics = async () => {
  try {
    checkFiles();
    checkEnvironment();
    
    const portsOk = await checkPorts();
    const ngrokOk = await checkNgrok();

    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log('========================');
    
    if (checks.length === 0 && portsOk && ngrokOk) {
      console.log('✅ All checks passed! Ready to start PM2 services.');
      process.exit(0);
    } else {
      console.log('❌ Some issues found. Please fix them before starting PM2.');
      if (!portsOk) {
        console.log('   - Kill existing processes using ports 3000, 3001, 8080');
      }
      if (!ngrokOk) {
        console.log('   - Authenticate ngrok with your authtoken');
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    process.exit(1);
  }
};

runDiagnostics();