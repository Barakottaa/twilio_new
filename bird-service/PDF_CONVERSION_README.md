# PDF to Image Conversion Service

This service receives PDF files from Bird WhatsApp webhooks, converts them to images, and sends the images back to the user.

## Features

- 📄 **PDF Processing**: Automatically detects PDF files from Bird webhooks
- 🖼️ **Image Conversion**: Converts PDF pages to high-quality PNG images
- 📱 **WhatsApp Integration**: Sends converted images back via Bird API
- 🔧 **Image Optimization**: Optimizes images for WhatsApp (1024x1024, compressed)
- 🧹 **Auto Cleanup**: Automatically cleans up temporary files
- 📊 **Multi-page Support**: Handles PDFs with multiple pages
- 🌐 **Webhook Ready**: Ready for Bird webhook integration

## Installation

1. **Install dependencies**:
```bash
cd bird-service-package
npm install
```

2. **Install system dependencies** (for PDF processing):
```bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install poppler-utils

# On Windows (using Chocolatey)
choco install poppler

# On macOS
brew install poppler
```

3. **Configure environment variables**:
```bash
# Copy the example file
cp env.example .env

# Edit .env with your Bird API credentials
BIRD_API_KEY=your_bird_api_key
BIRD_WORKSPACE_ID=your_workspace_id
BIRD_CHANNEL_ID=your_channel_id
BIRD_WHATSAPP_NUMBER=your_whatsapp_number
```

## Usage

### Start the Service

```bash
# Development mode
npm run dev

# Production mode
npm start

# Using PM2
pm2 start server.js --name "bird-pdf-service"
```

### API Endpoints

#### Health Check
```bash
GET /health
```

#### PDF Webhook (for Bird integration)
```bash
POST /api/bird/pdf-webhook
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
      "document": {
        "url": "https://example.com/document.pdf",
        "mimeType": "application/pdf"
      }
    }
  }
}
```

#### Test PDF Conversion
```bash
POST /api/test-pdf-conversion
Content-Type: application/json

{
  "pdfUrl": "https://example.com/document.pdf",
  "phoneNumber": "+201016666348"
}
```

#### Send Text Message
```bash
POST /api/send-message
Content-Type: application/json

{
  "phoneNumber": "+201016666348",
  "text": "Hello from PDF service!"
}
```

#### Configuration Check
```bash
GET /api/config
```

#### Cleanup Old Files
```bash
POST /api/cleanup
```

## Testing

Run the comprehensive test suite:

```bash
# Test all functionality
node test-pdf-conversion.js

# Test individual components
node -e "require('./test-pdf-conversion').testHealthCheck()"
```

## Webhook Configuration

### Bird Dashboard Setup

1. **Go to your Bird dashboard**
2. **Navigate to Webhooks section**
3. **Add new webhook**:
   - URL: `https://your-domain.com/api/bird/pdf-webhook`
   - Events: `whatsapp.inbound`
   - Method: `POST`

### Webhook Payload Format

The service expects Bird webhooks with this structure:

```json
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
      "document": {
        "url": "https://example.com/document.pdf",
        "mimeType": "application/pdf",
        "filename": "document.pdf"
      }
    }
  }
}
```

## How It Works

1. **Webhook Reception**: Service receives webhook from Bird
2. **PDF Detection**: Checks if the message contains a PDF file
3. **PDF Download**: Downloads the PDF from the provided URL
4. **Image Conversion**: Converts each PDF page to PNG images
5. **Image Optimization**: Optimizes images for WhatsApp (1024x1024, compressed)
6. **Image Sending**: Sends each image back to the user via Bird API
7. **Cleanup**: Removes temporary files

## File Structure

```
bird-service-package/
├── server.js                    # Main server file
├── pdf-to-image-service.js      # PDF conversion service
├── bird-service.js             # Bird API service
├── test-pdf-conversion.js      # Test suite
├── temp/                       # Temporary PDF files
├── output/                     # Converted images
└── package.json               # Dependencies
```

## Configuration Options

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BIRD_API_KEY` | Your Bird API key | ✅ |
| `BIRD_WORKSPACE_ID` | Bird workspace ID | ✅ |
| `BIRD_CHANNEL_ID` | Bird channel ID | ✅ |
| `BIRD_WHATSAPP_NUMBER` | Your WhatsApp number | ✅ |
| `PORT` | Server port | ❌ (default: 3001) |
| `NODE_ENV` | Environment | ❌ (default: production) |

### Service Configuration

The service automatically:
- Creates `temp/` and `output/` directories
- Cleans up files older than 24 hours
- Optimizes images for WhatsApp
- Handles multi-page PDFs
- Provides error messages in Arabic

## Error Handling

The service includes comprehensive error handling:

- **PDF Download Errors**: Sends error message to user
- **Conversion Errors**: Logs errors and notifies user
- **API Errors**: Handles Bird API failures gracefully
- **File System Errors**: Manages disk space and permissions

## Monitoring

### Logs

The service logs all activities:
- PDF processing steps
- Image conversion progress
- API calls to Bird
- Error messages and stack traces

### Health Checks

Monitor service health:
```bash
curl http://localhost:3001/health
```

### Configuration Validation

Check configuration:
```bash
curl http://localhost:3001/api/config
```

## Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start service
pm2 start server.js --name "bird-pdf-service"

# Save configuration
pm2 save

# Setup auto-start
pm2 startup
```

### Using Docker

```dockerfile
FROM node:18-alpine

# Install poppler-utils for PDF processing
RUN apk add --no-cache poppler-utils

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 3001
CMD ["npm", "start"]
```

### Using Nginx

```nginx
location /api/bird/pdf-webhook {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Troubleshooting

### Common Issues

1. **PDF conversion fails**:
   - Check if poppler-utils is installed
   - Verify PDF file is accessible
   - Check disk space

2. **Bird API errors**:
   - Verify API credentials
   - Check network connectivity
   - Review API rate limits

3. **File permission errors**:
   - Ensure write permissions for temp/ and output/ directories
   - Check disk space

### Debug Mode

Enable debug logging:
```bash
DEBUG=pdf-service node server.js
```

### Manual Testing

Test PDF conversion manually:
```bash
curl -X POST http://localhost:3001/api/test-pdf-conversion \
  -H "Content-Type: application/json" \
  -d '{
    "pdfUrl": "https://example.com/test.pdf",
    "phoneNumber": "+201016666348"
  }'
```

## Support

For issues and questions:
1. Check the logs for error messages
2. Verify configuration with `/api/config`
3. Test with the provided test suite
4. Review the Bird API documentation

## License

MIT License - see LICENSE file for details.
