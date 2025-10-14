# Bird WhatsApp Service

A standalone Node.js service for handling Bird WhatsApp API integration, including template message sending and webhook processing.

## Features

- ✅ Send WhatsApp template messages
- ✅ Send simple text messages
- ✅ Process Bird webhook events
- ✅ Handle button click responses
- ✅ Invoice template with payment buttons
- ✅ Comprehensive error handling
- ✅ Health check endpoint

## Quick Start

### 1. Installation

```bash
cd bird-service-package
npm install
```

### 2. Environment Setup

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Edit `.env` with your Bird API credentials:

```env
BIRD_API_KEY=your_bird_api_key_here
BIRD_WHATSAPP_NUMBER=+201100414204
BIRD_WORKSPACE_ID=2d7a1e03-25e4-401e-bf1e-0ace545673d7
BIRD_CHANNEL_ID=8e046034-bca7-5124-89d0-1a64c1cbe819
INVOICE_TEMPLATE_PROJECT_ID=3c476178-73f1-4eb3-b3a8-e885575fd3be
INVOICE_TEMPLATE_VERSION_ID=6abf0d77-c3cc-448e-a7c2-6b60f272235e
PORT=3001
```

### 3. Run the Service

```bash
# Development
npm run dev

# Production
npm start
```

The service will start on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /health
```

### Send Template Message
```
POST /api/send-template
Content-Type: application/json

{
  "phoneNumber": "+201016666348",
  "projectId": "3c476178-73f1-4eb3-b3a8-e885575fd3be",
  "templateVersion": "6abf0d77-c3cc-448e-a7c2-6b60f272235e",
  "locale": "ar",
  "parameters": [
    {
      "type": "string",
      "key": "patient_name",
      "value": "عبدالرحمن"
    }
  ]
}
```

### Send Text Message
```
POST /api/send-text
Content-Type: application/json

{
  "phoneNumber": "+201016666348",
  "text": "Hello from Bird service!"
}
```

### Send Invoice Template
```
POST /api/send-invoice
Content-Type: application/json

{
  "phoneNumber": "+201016666348",
  "invoiceData": {
    "patientName": "عبدالرحمن",
    "labNo": "1",
    "totalPaid": "400",
    "remaining": "100"
  }
}
```

### Bird Webhook
```
POST /api/bird/webhook
Content-Type: application/json

{
  "service": "channels",
  "event": "whatsapp.inbound",
  "payload": {
    "sender": {
      "contact": {
        "identifierValue": "+201016666348"
      }
    },
    "body": {
      "text": {
        "actions": [
          {
            "type": "postback",
            "postback": {
              "payload": "PAY_VCASH"
            }
          }
        ]
      }
    }
  }
}
```

## Webhook Configuration

Configure your Bird dashboard to send webhooks to:
```
https://your-domain.com/api/bird/webhook
```

Subscribe to these events:
- `whatsapp.inbound`

## Testing

Run the test script:
```bash
npm test
```

## Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name "bird-service"
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BIRD_API_KEY` | Your Bird API key | ✅ |
| `BIRD_WHATSAPP_NUMBER` | Your WhatsApp number | ✅ |
| `BIRD_WORKSPACE_ID` | Bird workspace ID | ✅ |
| `BIRD_CHANNEL_ID` | Bird channel ID | ✅ |
| `INVOICE_TEMPLATE_PROJECT_ID` | Invoice template project ID | ✅ |
| `INVOICE_TEMPLATE_VERSION_ID` | Invoice template version ID | ✅ |
| `PORT` | Server port | ❌ (default: 3001) |
| `NODE_ENV` | Environment | ❌ (default: production) |

## Response Format

All API endpoints return JSON responses:

### Success Response
```json
{
  "success": true,
  "messageId": "abc123-def456-ghi789",
  "status": "accepted",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "status": 400
}
```

## Integration with Other Services

You can integrate this service with your main application by making HTTP requests:

```javascript
// Send invoice template
const response = await fetch('http://bird-service:3001/api/send-invoice', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+201016666348',
    invoiceData: {
      patientName: 'عبدالرحمن',
      labNo: '1',
      totalPaid: '400',
      remaining: '100'
    }
  })
});

const result = await response.json();
```

## Support

For issues or questions, check the logs and ensure all environment variables are properly configured.
