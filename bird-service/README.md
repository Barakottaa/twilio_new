# Bird Service

## Overview
Express.js service that handles Bird WhatsApp API integration with PDF to image conversion capabilities.

## Features
- Bird WhatsApp API integration
- PDF to image conversion using poppler
- Image optimization for WhatsApp
- Webhook handling for incoming messages
- Button click responses

## Configuration
Copy `env.example` to `.env` and configure:
- Bird API credentials
- Workspace and channel IDs
- PDF conversion settings

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

## API Endpoints
- `GET /health` - Health check
- `POST /api/bird/webhook` - Bird webhook handler (processes patient requests)
- `POST /api/process-pdf-folder` - Process PDF from folder and send images


## Patient PDF to Image Conversion

The service automatically processes patient requests and converts their PDFs to images:

### How It Works
1. **Patient sends request** via WhatsApp (e.g., "عايز التقرير في صور")
2. **Bird sends webhook** to the listener with patient phone number
3. **Listener extracts phone number** and looks up patient folder
4. **PDF is converted to images** and sent back to the patient
5. **Images are sent** via Bird API to the same phone number

### Process PDF from Folder
```bash
curl -X POST http://localhost:3001/api/process-pdf-folder \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+201100414204"
  }'
```

## Services
- **BirdService**: Core Bird API integration
- **PdfToImageService**: PDF to image conversion
- **Server**: Express.js web server

## Webhook URL
```
https://your-ngrok-url.ngrok-free.dev/bird/api/bird/webhook
```

## Logs
Logs are written to `logs/` directory with rotation