# Twilio WhatsApp Project Structure

This document outlines the organized structure of the Twilio WhatsApp project with Bird integration.

## 📁 Project Organization

```
twilio_new/
├── src/                          # Main Next.js application
│   ├── app/                      # Next.js app router
│   ├── components/               # React components
│   ├── lib/                      # Core libraries and services
│   └── ...
├── bird-services/                # Bird WhatsApp service (standalone)
│   ├── server.js                 # Bird service server
│   ├── bird-service.js           # Bird API service
│   ├── simple-proxy.js           # Reverse proxy for routing
│   └── ...
├── bird-tools/                   # Bird utilities and scripts
│   ├── send-bird-template.js     # Template sender (main tool)
│   ├── test-bird-*.js           # Testing scripts
│   └── README.md                # Bird tools documentation
├── docs/                         # Project documentation
├── database.sqlite              # SQLite database
└── PROJECT_STRUCTURE.md         # This file
```

## 🚀 Services Overview

### 1. Main Twilio Application
- **Location**: `src/` directory
- **Port**: 3000
- **Purpose**: Main WhatsApp chat interface and Twilio integration
- **Start**: `npm run dev`

### 2. Bird WhatsApp Service
- **Location**: `bird-services/` directory
- **Port**: 3001
- **Purpose**: Standalone Bird API service for template messages
- **Start**: `cd bird-services && npm start`

### 3. Reverse Proxy
- **Location**: `bird-services/simple-proxy.js`
- **Port**: 8080
- **Purpose**: Routes requests to both services through single ngrok tunnel
- **Start**: `cd bird-services && node simple-proxy.js`

## 🔄 Request Flow

```
Internet → Ngrok → Proxy (8080) → {
  /bird/* → Bird Service (3001)
  /* → Twilio App (3000)
}
```

## 🛠️ Development Workflow

### Starting All Services

1. **Start Main App:**
   ```bash
   npm run dev
   ```

2. **Start Bird Service:**
   ```bash
   cd bird-services
   npm start
   ```

3. **Start Proxy:**
   ```bash
   cd bird-services
   node simple-proxy.js
   ```

4. **Start Ngrok:**
   ```bash
   ngrok http 8080
   ```

### Sending Templates

Use the organized template sender:
```bash
cd bird-tools
node send-bird-template.js --phone=+201016666348 --lab=5 --paid=800 --remaining=300
```

## 📋 Webhook Configuration

### Bird Dashboard
```
https://your-ngrok-url.ngrok-free.dev/bird/api/bird/webhook
```

### Twilio Console
```
https://your-ngrok-url.ngrok-free.dev/api/twilio/webhook
https://your-ngrok-url.ngrok-free.dev/api/twilio/conversations-events
```

## 🧪 Testing

### Test Bird Integration
```bash
cd bird-tools
node test-bird-api-simple.js
```

### Test Webhooks
```bash
cd bird-tools
node test-bird-webhook.js
```

## 📚 Documentation

- **Bird Tools**: `bird-tools/README.md`
- **Bird Service**: `bird-services/README.md`
- **Main App**: Check `src/` directory for component documentation

## 🔧 Configuration

### Environment Variables

**Main App** (`.env.local`):
```
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=your_whatsapp_number
```

**Bird Service** (`bird-services/.env`):
```
BIRD_API_KEY=your_bird_api_key
BIRD_WHATSAPP_NUMBER=your_whatsapp_number
BIRD_WORKSPACE_ID=your_workspace_id
BIRD_CHANNEL_ID=your_channel_id
```

## 🎯 Key Features

- ✅ **Organized Structure**: Clean separation of concerns
- ✅ **Single Ngrok Tunnel**: Both services accessible through one URL
- ✅ **Template Sending**: Easy-to-use template sender
- ✅ **Webhook Integration**: Full webhook support for both services
- ✅ **Testing Tools**: Comprehensive testing scripts
- ✅ **Documentation**: Clear documentation for all components

## 🚨 Important Notes

1. **Service Dependencies**: Start services in order (Main App → Bird Service → Proxy → Ngrok)
2. **Port Conflicts**: Ensure ports 3000, 3001, and 8080 are available
3. **Environment Setup**: Configure both `.env.local` and `bird-services/.env`
4. **Webhook URLs**: Update webhook URLs in both Twilio and Bird dashboards

## 🔄 Migration from Old Structure

The project has been reorganized from a scattered structure to this clean organization:

- **Before**: Bird files scattered in main directory
- **After**: Organized into `bird-services/` and `bird-tools/` directories
- **Benefit**: Cleaner codebase, easier maintenance, better documentation
