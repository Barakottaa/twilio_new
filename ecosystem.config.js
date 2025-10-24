module.exports = {
  apps: [
    {
      name: 'twilio-app',
      script: 'start-twilio.js',
      cwd: 'D:\\New folder\\twilio_new\\twilio_chat',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        TZ: 'Africa/Cairo'
      },
      log_file: 'D:\\New folder\\twilio_new\\logs\\twilio-app\\twilio-app-combined.log',
      out_file: 'D:\\New folder\\twilio_new\\logs\\twilio-app\\twilio-app-out.log',
      error_file: 'D:\\New folder\\twilio_new\\logs\\twilio-app\\twilio-app-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      time: true
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
        TZ: 'Africa/Cairo'
      },
      log_file: 'D:\\New folder\\twilio_new\\logs\\bird-listener\\bird-listener-combined.log',
      out_file: 'D:\\New folder\\twilio_new\\logs\\bird-listener\\bird-listener-out.log',
      error_file: 'D:\\New folder\\twilio_new\\logs\\bird-listener\\bird-listener-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      time: true
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
      time: true
    },
    {
      name: 'reverse-proxy',
      script: 'simple-proxy-fixed.js',
      cwd: 'D:\\New folder\\twilio_new\\bird-service',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        TZ: 'Africa/Cairo'
      },
      log_file: 'D:\\New folder\\twilio_new\\logs\\reverse-proxy\\reverse-proxy-combined.log',
      out_file: 'D:\\New folder\\twilio_new\\logs\\reverse-proxy\\reverse-proxy-out.log',
      error_file: 'D:\\New folder\\twilio_new\\logs\\reverse-proxy\\reverse-proxy-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      time: true
    },
    {
      name: 'ngrok-tunnel',
      script: 'start-ngrok.js',
      cwd: 'D:\\New folder\\twilio_new\\bird-service',
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
      time: true
    }
  ]
};