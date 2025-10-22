# PM2 Configuration - Updated for Clean Structure

## Overview
The PM2 configuration has been updated to use the new clean project structure with separate service folders.

## Services Configuration

### 1. Main App (Next.js)
- **Name**: `main-app`
- **Directory**: `./main-app`
- **Script**: `npm run dev`
- **Port**: 3000
- **Environment**: Development
- **Logs**: `./logs/main-app-*.log`

### 2. Bird Service
- **Name**: `bird-service`
- **Directory**: `./bird-service`
- **Script**: `server.js`
- **Port**: 3001
- **Environment**: Production
- **Logs**: `./logs/bird-*.log`
- **Environment Variables**:
  - `BIRD_API_KEY`: EpYiBbBDjQv6U5oSty2Bxu8Ix5T9XOr9L2fl
  - `BIRD_WORKSPACE_ID`: 2d7a1e03-25e4-401e-bf1e-0ace545673d7
  - `BIRD_CHANNEL_ID`: 8e046034-bca7-5124-89d0-1a64c1cbe819
  - `PDF_TEMPLATE_PROJECT_ID`: b63bd76a-4cc6-463e-9db1-343901ea8dfe
  - `PDF_TEMPLATE_VERSION_ID`: e6cccbe7-863a-4d9f-a651-20863a81e8b3

### 3. Reverse Proxy
- **Name**: `reverse-proxy`
- **Directory**: `./bird-service`
- **Script**: `simple-proxy.js`
- **Port**: 8080
- **Environment**: Production
- **Logs**: `./logs/proxy-*.log`

### 4. Ngrok Tunnel
- **Name**: `ngrok-tunnel`
- **Directory**: `./`
- **Script**: `start-ngrok.js`
- **Environment**: Production
- **Logs**: `./logs/ngrok-*.log`

### 5. Lab Reports Processor
- **Name**: `lab-reports-processor`
- **Directory**: `./lab-reports-service`
- **Script**: `process-lab-reports.js`
- **Environment**: Production
- **Logs**: `./logs/lab-reports-*.log`

## Key Changes Made

### ✅ Updated Paths
- **Old**: `./bird-service-package` → **New**: `./bird-service`
- **Old**: `./scripts` → **New**: `./lab-reports-service`
- **Old**: `start-twilio.js` → **New**: `npm run dev` in `./main-app`

### ✅ Updated Environment Variables
- **Removed**: Old invoice template variables
- **Added**: PDF template variables for the working template
- **Updated**: Template IDs to use the approved PDF_test template

### ✅ Updated Service Names
- **Old**: `twilio-app` → **New**: `main-app`
- **Updated**: All service configurations to match new structure

## PM2 Commands

### Start All Services
```bash
pm2 start ecosystem.config.js
```

### Start Individual Service
```bash
pm2 start ecosystem.config.js --only main-app
pm2 start ecosystem.config.js --only bird-service
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
pm2 restart main-app
pm2 restart bird-service
```

### Stop Services
```bash
pm2 stop all
pm2 delete all
```

## Health Checks

- **Main App**: `http://localhost:3000`
- **Bird Service**: `http://localhost:3001/health`
- **Reverse Proxy**: `http://localhost:8080`
- **Lab Reports**: Check logs for processing status

## Logs Location

All logs are written to the `./logs/` directory:
- `main-app-error.log`, `main-app-out.log`, `main-app-combined.log`
- `bird-error.log`, `bird-out.log`, `bird-combined.log`
- `proxy-error.log`, `proxy-out.log`, `proxy-combined.log`
- `ngrok-error.log`, `ngrok-out.log`, `ngrok-combined.log`
- `lab-reports-error.log`, `lab-reports-out.log`, `lab-reports-combined.log`

## Status

✅ **Configuration Updated**: All paths and environment variables updated
✅ **Structure Clean**: Each service in its own folder
✅ **Template Fixed**: Using approved PDF_test template
✅ **Ready for Production**: All services configured for deployment
