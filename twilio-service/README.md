# Twilio Service

Express.js service that handles Twilio WhatsApp API integration with PDF to image conversion capabilities.

## Overview

This service is separated from the Bird service and provides complete Twilio WhatsApp functionality including:
- Twilio WhatsApp API integration
- PDF to image conversion using poppler
- Image optimization for WhatsApp
- Webhook handling for incoming messages
- Template message support

## Features

- Twilio WhatsApp API integration
- PDF to image conversion using poppler
- Image optimization for WhatsApp
- Webhook handling for incoming messages
- Template message support (Content Template Builder)
- Image serving for Twilio media URLs

## Configuration

Copy `env.example` to `.env` or `.env.local` and configure:
- Twilio API credentials (Account SID, Auth Token)
- WhatsApp number
- PDF conversion settings
- Public URL for image serving (ngrok or other)

## Installation

```bash
npm install
```

## Usage

```bash
# Start the listener
npm start

# Development mode with auto-restart
npm run dev
```

## Environment Requirements

- Node.js 16+
- Poppler-utils for PDF conversion
- Sharp for image optimization

## Environment Variables

### Required in `.env.local` or `.env`:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

### Optional:
```env
NGROK_URL=https://your-ngrok-url.ngrok-free.dev
PUBLIC_URL=https://your-public-url.com
PDF_BASE_DIR=D:\Results
PORT=3002
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/twilio/webhook` - Twilio webhook handler (processes patient requests)
- `POST /api/process-pdf-folder` - Process PDF from folder and send images
- `GET /images/:filename` - Serve images for Twilio media URLs
- `GET /api/config` - Configuration validation

## Patient PDF to Image Conversion

The service automatically processes patient requests and converts their PDFs to images:

### How It Works
1. **Patient sends request** via WhatsApp (e.g., "عايز التقرير في صور" or "image")
2. **Twilio sends webhook** to the listener with patient phone number
3. **Listener extracts phone number** and looks up patient folder
4. **PDF is converted to images** and sent back to the patient
5. **Images are sent** via Twilio API to the same phone number

### Process PDF from Folder
```bash
curl -X POST http://localhost:3002/api/process-pdf-folder \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890"
  }'
```

## Services

- **TwilioApiClient**: Core Twilio API integration
- **PdfToImageService**: PDF to image conversion
- **Server**: Express.js web server

## Webhook URL

```
https://your-ngrok-url.ngrok-free.dev/api/twilio/webhook
```

## Twilio Conversations API

This service **uses Twilio Conversations API** for sending messages and templates. This provides:
- ✅ Conversation context and threading
- ✅ Automatic conversation creation
- ✅ Participant management
- ✅ Better message history
- ✅ Ready for multi-agent support

All messages and templates are automatically associated with conversations for better context and future scalability.

## Logs

Logs are written to console. Set up log rotation as needed.

