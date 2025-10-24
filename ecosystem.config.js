module.exports = {
  apps: [
    {
      name: 'ngrok-tunnel',
      script: 'start-ngrok.js',
      cwd: 'D:\\New folder\\twilio_new',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        TZ: 'Africa/Cairo'
      },
      log_file: 'D:\\New folder\\twilio_new\\logs\\ngrok\\ngrok-combined.log',
      out_file: 'D:\\New folder\\twilio_new\\logs\\ngrok\\ngrok-out.log',
      error_file: 'D:\\New folder\\twilio_new\\logs\\ngrok\\ngrok-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      time: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'bird-listener',
      script: 'listener.js',
      cwd: 'D:\\New folder\\twilio_new\\bird-service',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        TZ: 'Africa/Cairo',
        BIRD_API_KEY: 'EpYiBbBDjQv6U5oSty2Bxu8Ix5T9XOr9L2fl',
        BIRD_WORKSPACE_ID: '2d7a1e03-25e4-401e-bf1e-0ace545673d7',
        BIRD_CHANNEL_ID: '8e046034-bca7-5124-89d0-1a64c1cbe819',
        PDF_TEMPLATE_PROJECT_ID: 'b63bd76a-4cc6-463e-9db1-343901ea8dfe',
        PDF_TEMPLATE_VERSION_ID: 'e6cccbe7-863a-4d9f-a651-20863a81e8b3',
        PDF_BASE_DIR: 'D:\\Results'
      },
      log_file: 'D:\\New folder\\twilio_new\\logs\\bird-listener\\bird-listener-combined.log',
      out_file: 'D:\\New folder\\twilio_new\\logs\\bird-listener\\bird-listener-out.log',
      error_file: 'D:\\New folder\\twilio_new\\logs\\bird-listener\\bird-listener-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      time: true,
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'lab-reports-processor',
      script: 'process-lab-reports.js',
      cwd: 'D:\\New folder\\twilio_new\\lab-reports-service',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        TZ: 'Africa/Cairo'
      },
      log_file: 'D:\\New folder\\twilio_new\\logs\\lab-reports\\lab-reports-combined.log',
      out_file: 'D:\\New folder\\twilio_new\\logs\\lab-reports\\lab-reports-out.log',
      error_file: 'D:\\New folder\\twilio_new\\logs\\lab-reports\\lab-reports-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      time: true,
      restart_delay: 10000,
      max_restarts: 5,
      min_uptime: '30s'
    }
  ]
};