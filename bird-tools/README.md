# Bird Tools

This directory contains all Bird-related tools and utilities for the Twilio WhatsApp project.

## 📁 Directory Structure

```
bird-tools/
├── send-bird-template.js          # Main template sender (recommended)
├── bird-template-sender.js        # Alternative template sender
├── test-bird-api-simple.js        # API testing script
├── test-bird-direct.js            # Direct API testing
├── test-bird-template-api.js      # Template API testing
├── test-bird-webhook.js           # Webhook testing
├── simple-proxy.js                # Simple reverse proxy
├── reverse-proxy.js               # Advanced reverse proxy
├── simple-http-proxy.js           # HTTP-only proxy
└── README.md                      # This file
```

## 🚀 Quick Start

### Send a Template Message

**Using the main template sender:**
```bash
# Send with default values
node send-bird-template.js

# Send with custom values
node send-bird-template.js --phone=+201016666348 --lab=5 --paid=800 --remaining=300

# Send with custom patient name
node send-bird-template.js --name="أحمد" --lab=10 --paid=1000 --remaining=500
```

### Test Bird API

```bash
# Test API connection
node test-bird-api-simple.js

# Test webhook
node test-bird-webhook.js
```

## 🔧 Proxy Setup

The project uses a reverse proxy to route both Twilio and Bird services through a single ngrok tunnel.

**Current Setup:**
- **Main Twilio Server**: Port 3000
- **Bird Service**: Port 3001 (in `../bird-services/`)
- **Reverse Proxy**: Port 8080
- **Ngrok Tunnel**: Points to port 8080

**Routing:**
- `https://your-ngrok-url.ngrok-free.dev/` → Twilio Server
- `https://your-ngrok-url.ngrok-free.dev/bird/` → Bird Service

## 📋 Webhook URLs

**For Bird Dashboard:**
```
https://your-ngrok-url.ngrok-free.dev/bird/api/bird/webhook
```

**For Twilio Console:**
```
https://your-ngrok-url.ngrok-free.dev/api/twilio/webhook
https://your-ngrok-url.ngrok-free.dev/api/twilio/conversations-events
```

## 🛠️ Available Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `send-bird-template.js` | Send invoice templates | `node send-bird-template.js [options]` |
| `test-bird-api-simple.js` | Test Bird API | `node test-bird-api-simple.js` |
| `test-bird-webhook.js` | Test webhook | `node test-bird-webhook.js` |
| `simple-proxy.js` | Start reverse proxy | `node simple-proxy.js` |

## 📱 Template Parameters

The invoice template supports these parameters:
- `patient_name`: Patient's name (Arabic)
- `lab_no`: Lab number
- `total_paid`: Total amount paid
- `remaining`: Remaining amount

## 🔄 Integration

These tools can be integrated into other applications:

```javascript
const { sendInvoiceTemplate } = require('./send-bird-template.js');

// Send template programmatically
const result = await sendInvoiceTemplate({
  phone: '+201016666348',
  patientName: 'عبدالرحمن',
  labNo: '5',
  totalPaid: '800',
  remaining: '300'
});
```

## 📞 Support

For issues or questions about Bird integration, check the main project documentation or contact the development team.
