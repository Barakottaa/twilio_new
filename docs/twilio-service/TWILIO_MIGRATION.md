# Twilio Migration Guide

## Overview

This document describes the migration from Bird API to Twilio API for WhatsApp messaging in the bird-service.

## What Changed

### 1. New Twilio API Client (`twilio-api-client.js`)
- **Purpose**: Complete Twilio WhatsApp API client
- **Methods**:
  - `sendMessage(to, text)` - Send text messages
  - `sendTemplateMessage(phoneNumber, contentSid, contentVariables)` - Send template messages
  - `sendImageMessage(to, imagePath, caption, baseUrl)` - Send images from local files
  - `sendImageMessageByUrl(to, mediaUrl, caption)` - Send images from public URLs
  - `validateConfig()` - Validate Twilio configuration
  - `testConnection()` - Test Twilio API connection

### 2. Updated PDF to Image Service (`pdf-to-image-service.js`)
- **Changed**: Now uses `TwilioApiClient` instead of `BirdApiClient`
- **New Method**: `sendImageToTwilio()` - Sends images via Twilio
- **Deprecated**: `sendImageToBird()` - Kept for backward compatibility

### 3. Updated Listener (`listener.js`)
- **New Webhook Endpoint**: `/api/twilio/webhook` - Handles Twilio webhooks
- **New Image Serving**: `/images/:filename` - Serves images for Twilio (Twilio requires public URLs)
- **Environment Loading**: Now supports `.env.local` (checked first) and `.env`
- **Deprecated**: `/api/bird/webhook` - Kept for backward compatibility

### 4. Updated Dependencies (`package.json`)
- **Added**: `twilio` (^5.3.0) - Twilio SDK
- **Added**: `form-data` (^2.5.2) - For form data handling

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
PORT=3001
```

## Twilio Webhook Format

Twilio sends webhooks in this format:
```json
{
  "From": "whatsapp:+1234567890",
  "Body": "message text",
  "MessageSid": "SM...",
  "AccountSid": "AC...",
  ...
}
```

The listener extracts:
- Phone number from `From` field (removes `whatsapp:` prefix)
- Message from `Body` field

## Image Sending Differences

### Bird API:
- Supports direct file upload via presigned URLs
- Uploads file, then sends message with media URL

### Twilio API:
- **Requires public URLs** for media
- Images must be accessible via HTTP/HTTPS
- Solution: Images are served via `/images/:filename` endpoint
- The service constructs URLs like: `{baseUrl}/images/{filename}`

## Migration Steps

1. **Install Dependencies**:
   ```bash
   cd bird-service
   npm install
   ```

2. **Configure Environment**:
   - Create `.env.local` with Twilio credentials
   - Or update existing `.env` file

3. **Update Webhook URL in Twilio**:
   - Old: `https://your-ngrok-url/api/bird/webhook`
   - New: `https://your-ngrok-url/api/twilio/webhook`

4. **Set NGROK_URL** (if using ngrok):
   ```env
   NGROK_URL=https://your-ngrok-url.ngrok-free.dev
   ```

5. **Test**:
   ```bash
   npm start
   # Check health: http://localhost:3001/health
   ```

## Template Messages

### Twilio Content Template Builder

To send template messages, you need:
1. **Content SID**: Created in Twilio Console via Content Template Builder
2. **Content Variables**: Object with variable values

Example:
```javascript
const twilioClient = new TwilioApiClient();
await twilioClient.sendTemplateMessage(
  '+1234567890',
  'HX1234567890abcdef1234567890abcdef', // Content SID
  {
    '1': 'John Doe',      // Variable 1
    '2': 'Invoice #123'   // Variable 2
  }
);
```

## API Endpoints

### New Endpoints:
- `GET /health` - Health check (now shows Twilio status)
- `POST /api/twilio/webhook` - Twilio webhook handler
- `GET /images/:filename` - Serve images for Twilio media URLs
- `GET /api/config` - Configuration validation (now shows Twilio config)

### Deprecated (but still working):
- `POST /api/bird/webhook` - Bird webhook (for backward compatibility)

## Testing

### Test Twilio Connection:
```javascript
const TwilioApiClient = require('./twilio-api-client');
const client = new TwilioApiClient();
const result = await client.testConnection();
console.log(result);
```

### Test Webhook:
```bash
curl -X POST http://localhost:3001/api/twilio/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "From": "whatsapp:+1234567890",
    "Body": "image"
  }'
```

### Test PDF Processing:
```bash
curl -X POST http://localhost:3001/api/process-pdf-folder \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890"
  }'
```

## Important Notes

1. **Images Must Be Public**: Twilio requires images to be accessible via public URL
2. **Image Serving**: The service automatically serves images via `/images/:filename`
3. **Base URL**: Set `NGROK_URL` or `PUBLIC_URL` environment variable for image URLs
4. **Phone Number Format**: Twilio uses `whatsapp:+1234567890` format
5. **Backward Compatibility**: Bird webhook endpoint still works but is deprecated

## Troubleshooting

### Images Not Sending:
- Check that `NGROK_URL` or `PUBLIC_URL` is set correctly
- Verify images are accessible at `{baseUrl}/images/{filename}`
- Check Twilio logs in Twilio Console

### Webhook Not Receiving:
- Verify webhook URL in Twilio Console
- Check that ngrok is running and URL is correct
- Verify webhook endpoint is accessible: `http://localhost:3001/api/twilio/webhook`

### Template Messages Not Working:
- Verify Content SID is correct
- Check Content Template Builder in Twilio Console
- Ensure variables match template variable names

## Next Steps

1. Test all functionality with Twilio
2. Update production webhook URLs
3. Monitor logs for any issues
4. Remove Bird API code once fully migrated (optional)

