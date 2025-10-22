# Bird Service

## Overview
Express.js service that handles Bird WhatsApp API integration with PDF to image conversion capabilities.

## Features
- Bird WhatsApp API integration
- PDF to image conversion using poppler
- Image optimization for WhatsApp
- Webhook handling for incoming messages
- Template message sending
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
# Start the service
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
- `POST /api/bird/webhook` - Bird webhook handler
- `POST /api/bird/pdf-webhook` - PDF processing webhook

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