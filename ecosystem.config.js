module.exports = {
  apps: [
    {
      name: 'twilio-app',
      cwd: './',
      script: 'start-twilio.js',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      autorestart: true,
      max_restarts: 3,
      min_uptime: '30s',
      max_memory_restart: '1G',
      restart_delay: 10000,
      error_file: './logs/twilio-error.log',
      out_file: './logs/twilio-out.log',
      log_file: './logs/twilio-combined.log',
      time: true,
      kill_timeout: 10000,
      listen_timeout: 15000,
      wait_ready: true,
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'bird-service',
      cwd: './bird-service-package',
      script: 'start-bird.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        BIRD_API_KEY: 'EpYiBbBDjQv6U5oSty2Bxu8Ix5T9XOr9L2fl',
        BIRD_WHATSAPP_NUMBER: '+201100414204',
        BIRD_WORKSPACE_ID: '2d7a1e03-25e4-401e-bf1e-0ace545673d7',
        BIRD_CHANNEL_ID: '8e046034-bca7-5124-89d0-1a64c1cbe819',
        INVOICE_TEMPLATE_PROJECT_ID: '3c476178-73f1-4eb3-b3a8-e885575fd3be',
        INVOICE_TEMPLATE_VERSION_ID: '6abf0d77-c3cc-448e-a7c2-6b60f272235e',
        INVOICE_TEMPLATE_PARAMETERS: 'patient_name,lab_no,total_paid,remaining'
      },
      watch: false,
      autorestart: true,
      max_restarts: 3,
      min_uptime: '30s',
      max_memory_restart: '1G',
      restart_delay: 10000,
      error_file: './logs/bird-error.log',
      out_file: './logs/bird-out.log',
      log_file: './logs/bird-combined.log',
      time: true,
      kill_timeout: 10000,
      listen_timeout: 15000,
      wait_ready: true,
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'reverse-proxy',
      cwd: './bird-service-package',
      script: 'simple-proxy.js',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      watch: false,
      autorestart: true,
      max_restarts: 3,
      min_uptime: '30s',
      max_memory_restart: '1G',
      restart_delay: 10000,
      error_file: './logs/proxy-error.log',
      out_file: './logs/proxy-out.log',
      log_file: './logs/proxy-combined.log',
      time: true,
      kill_timeout: 10000,
      listen_timeout: 15000,
      wait_ready: true,
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'ngrok-tunnel',
      script: 'start-ngrok.js',
      cwd: './',
      env: {
        NODE_ENV: 'production'
      },
      watch: false,
      autorestart: true,
      max_restarts: 2,
      min_uptime: '60s',
      restart_delay: 15000,
      error_file: './logs/ngrok-error.log',
      out_file: './logs/ngrok-out.log',
      log_file: './logs/ngrok-combined.log',
      time: true,
      kill_timeout: 15000,
      listen_timeout: 20000,
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'lab-reports-processor',
      script: 'process-lab-reports.js',
      cwd: './lab-reports-service',
      env: {
        NODE_ENV: 'production'
      },
      watch: false,
      autorestart: true,
      max_restarts: 3,
      min_uptime: '30s',
      max_memory_restart: '1G',
      restart_delay: 10000,
      error_file: '/dev/null',
      out_file: '/dev/null',
      log_file: '/dev/null',
      time: false,
      kill_timeout: 10000,
      listen_timeout: 15000,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
};
