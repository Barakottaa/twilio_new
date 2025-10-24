# PM2 Configuration - Simplified Production Setup

## Overview
Simplified PM2 configuration with only the essential services for production deployment.

## Services Configuration

### 1. Ngrok Tunnel
- **Name**: `ngrok-tunnel`
- **Script**: `start-ngrok.js`
- **Directory**: `./` (root)
- **Purpose**: Creates public tunnel for Bird listener
- **Port**: 3001 (tunneled)
- **Environment**: Production
- **Logs**: `./logs/ngrok/ngrok-*.log`
- **Restart Policy**: 5s delay, 10 max restarts, 10s min uptime

### 2. Bird Listener
- **Name**: `bird-listener`
- **Script**: `listener.js`
- **Directory**: `./bird-service`
- **Port**: 3001
- **Environment**: Production
- **Logs**: `./logs/bird-listener/bird-listener-*.log`
- **Environment Variables**:
  - `BIRD_API_KEY`: EpYiBbBDjQv6U5oSty2Bxu8Ix5T9XOr9L2fl
  - `BIRD_WORKSPACE_ID`: 2d7a1e03-25e4-401e-bf1e-0ace545673d7
  - `BIRD_CHANNEL_ID`: 8e046034-bca7-5124-89d0-1a64c1cbe819
  - `PDF_TEMPLATE_PROJECT_ID`: b63bd76a-4cc6-463e-9db1-343901ea8dfe
  - `PDF_TEMPLATE_VERSION_ID`: e6cccbe7-863a-4d9f-a651-20863a81e8b3
  - `PDF_BASE_DIR`: D:\Results
- **Restart Policy**: 5s delay, 10 max restarts, 10s min uptime

### 3. Lab Reports Processor
- **Name**: `lab-reports-processor`
- **Script**: `process-lab-reports.js`
- **Directory**: `./lab-reports-service`
- **Environment**: Production
- **Logs**: `./logs/lab-reports/lab-reports-*.log`
- **Restart Policy**: 10s delay, 5 max restarts, 30s min uptime

## Key Features

### ✅ Simplified Services
- **Removed**: Main app, reverse proxy
- **Kept**: Only essential services for WhatsApp PDF processing
- **Focus**: Bird WhatsApp integration + Lab reports processing

### ✅ Enhanced Reliability
- **Restart Policies**: Different restart strategies for each service
- **Min Uptime**: Prevents rapid restart loops
- **Max Restarts**: Limits restart attempts
- **Restart Delays**: Prevents system overload

### ✅ Production Ready
- **Environment Variables**: All required config included
- **Logging**: Comprehensive logging for each service
- **Timezone**: Africa/Cairo timezone
- **Error Handling**: Robust error recovery

## PM2 Commands

### Start All Services
```bash
pm2 start ecosystem.config.js
```

### Start Individual Service
```bash
pm2 start ecosystem.config.js --only ngrok-tunnel
pm2 start ecosystem.config.js --only bird-listener
pm2 start ecosystem.config.js --only lab-reports-processor
```

### Monitor Services
```bash
pm2 monit
pm2 status
pm2 logs
```

### Restart Services
```bash
pm2 restart all
pm2 restart bird-listener
pm2 restart lab-reports-processor
```

### Stop Services
```bash
pm2 stop all
pm2 delete all
```

## Health Checks

- **Bird Listener**: `http://localhost:3001/health`
- **Ngrok Tunnel**: Check `https://dashboard.ngrok.com/status/tunnels`
- **Lab Reports**: Check logs for processing status

## Logs Location

All logs are written to the `./logs/` directory:
- `ngrok/ngrok-combined.log`, `ngrok-out.log`, `ngrok-error.log`
- `bird-listener/bird-listener-combined.log`, `bird-listener-out.log`, `bird-listener-error.log`
- `lab-reports/lab-reports-combined.log`, `lab-reports-out.log`, `lab-reports-error.log`

## Service Dependencies

1. **Lab Reports Processor**: Runs independently
2. **Bird Listener**: Depends on lab reports for PDF generation
3. **Ngrok Tunnel**: Depends on Bird Listener being available

## Startup Order

1. Start `lab-reports-processor` first
2. Start `bird-listener` second
3. Start `ngrok-tunnel` last

## Status

✅ **Configuration Simplified**: Only essential services included
✅ **Production Ready**: All environment variables configured
✅ **Reliable**: Enhanced restart policies
✅ **Focused**: WhatsApp PDF processing workflow only