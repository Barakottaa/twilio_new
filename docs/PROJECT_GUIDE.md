# 🚀 Twilio + Bird WhatsApp Project Guide

## 📁 Project Structure

```
twilio_new/
├── 📱 TWILIO_APP/                    # Main Twilio WhatsApp Application
│   ├── src/                         # Next.js application
│   ├── package.json                 # Twilio app dependencies
│   └── .env.local                   # Twilio environment variables
│
├── 🕊️ BIRD_SERVICE/                 # Standalone Bird WhatsApp Service
│   ├── bird-service-package/        # Bird service implementation
│   ├── bird-tools/                  # Bird utilities and scripts
│   └── .env                         # Bird environment variables
│
├── 🔧 SHARED/                       # Shared configurations
│   ├── ecosystem.config.js          # PM2 configuration
│   ├── pm2-scripts.bat              # PM2 management scripts
│   └── PROJECT_GUIDE.md             # This guide
│
└── 🌐 PUBLIC_ACCESS/                # Public endpoints
    └── ngrok tunnel                 # Single tunnel for both services
```

## 🎯 Service Overview

### 📱 **TWILIO_APP** (Port 3000)
- **Purpose**: Main WhatsApp Business management platform
- **Features**: Agent management, conversation tracking, message history
- **Webhook**: `/api/twilio/webhook`
- **Access**: `https://your-ngrok-url.ngrok-free.dev/`

### 🕊️ **BIRD_SERVICE** (Port 3001)
- **Purpose**: Bird WhatsApp API service for templates and payments
- **Features**: Template sending, payment buttons, webhook processing
- **Webhook**: `/api/bird/webhook`
- **Access**: `https://your-ngrok-url.ngrok-free.dev/bird/`

## 🚀 Quick Start

### 1. Start All Services
```bash
# Start everything with PM2
pm2-scripts.bat start

# Or start individually
pm2 start ecosystem.config.js
```

### 2. Check Service Status
```bash
pm2 status
pm2 logs
```

### 3. Test Services
```bash
# Test Twilio app
curl http://localhost:3000/api/health

# Test Bird service
curl http://localhost:3001/health

# Test through proxy
curl http://localhost:8080/health
curl http://localhost:8080/bird/health
```

## 🔧 Configuration

### Environment Variables

#### TWILIO_APP (.env.local)
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=+13464864372

# Bird Configuration (for webhook replies)
BIRD_API_KEY=EpYiBbBDjQv6U5oSty2Bxu8Ix5T9XOr9L2fl
BIRD_WHATSAPP_NUMBER=+201100414204
```

#### BIRD_SERVICE (.env)
```env
# Bird API Configuration
BIRD_API_KEY=EpYiBbBDjQv6U5oSty2Bxu8Ix5T9XOr9L2fl
BIRD_WHATSAPP_NUMBER=+201100414204
BIRD_WORKSPACE_ID=2d7a1e03-25e4-401e-bf1e-0ace545673d7
BIRD_CHANNEL_ID=8e046034-bca7-5124-89d0-1a64c1cbe819

# Template Configuration
INVOICE_TEMPLATE_PROJECT_ID=3c476178-73f1-4eb3-b3a8-e885575fd3be
INVOICE_TEMPLATE_VERSION_ID=6abf0d77-c3cc-448e-a7c2-6b60f272235e
```

## 🌐 Public URLs

### Current Ngrok URL
```
https://undegenerated-nonviscidly-marylou.ngrok-free.dev
```

### Webhook URLs
- **Twilio Webhook**: `https://undegenerated-nonviscidly-marylou.ngrok-free.dev/api/twilio/webhook`
- **Bird Webhook**: `https://undegenerated-nonviscidly-marylou.ngrok-free.dev/bird/api/bird/webhook`

## 🛠️ Development

### TWILIO_APP Development
```bash
cd twilio_new
npm run dev
```

### BIRD_SERVICE Development
```bash
cd bird-service-package
npm start
```

### Send Bird Templates
```bash
cd bird-tools
node send-bird-template.js --phone=+201100414204 --lab=1 --paid=400 --remaining=100
```

## 📊 Monitoring

### PM2 Commands
```bash
pm2-scripts.bat status    # Check status
pm2-scripts.bat logs      # View logs
pm2-scripts.bat restart   # Restart services
pm2-scripts.bat stop      # Stop services
```

### Service Health Checks
- **Twilio**: `http://localhost:3000/api/health`
- **Bird**: `http://localhost:3001/health`
- **Proxy**: `http://localhost:8080/health`

## 🐛 Troubleshooting

### Common Issues
1. **Port conflicts**: Kill existing processes with `taskkill /F /IM node.exe`
2. **Environment variables**: Check `.env` files are properly configured
3. **Ngrok authentication**: Run `ngrok config add-authtoken YOUR_TOKEN`
4. **PM2 crashes**: Check logs with `pm2 logs`

### Debug Commands
```bash
# Check what's running on ports
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"
netstat -ano | findstr ":8080"

# Kill all Node processes
taskkill /F /IM node.exe

# Restart PM2
pm2 delete all
pm2 start ecosystem.config.js
```

## 📝 Notes

- Both services run independently but share the same ngrok tunnel
- Reverse proxy routes traffic based on URL paths
- Bird service handles template messages and payment buttons
- Twilio app handles conversation management and agent interface
- All services are managed by PM2 for reliability and auto-restart
