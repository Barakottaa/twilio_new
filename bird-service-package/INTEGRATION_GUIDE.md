# PDF to Image Conversion - Integration Guide

## Quick Start

1. **Setup the service**:
```bash
# Windows
setup-pdf-service.bat

# Linux/macOS
./setup-pdf-service.sh
```

2. **Configure Bird webhook**:
   - Go to your Bird dashboard
   - Add webhook URL: `https://your-domain.com/api/bird/pdf-webhook`
   - Subscribe to `whatsapp.inbound` events

3. **Test the service**:
```bash
node test-pdf-conversion.js
```

## How It Works

### 1. User sends PDF to WhatsApp
- User sends a PDF file via WhatsApp to your Bird number
- Bird receives the message and triggers webhook

### 2. Webhook Processing
- Service receives webhook at `/api/bird/pdf-webhook`
- Extracts PDF URL and contact information
- Downloads PDF file from the URL

### 3. PDF Conversion
- Converts each PDF page to PNG images
- Optimizes images for WhatsApp (1024x1024, compressed)
- Stores images temporarily

### 4. Image Delivery
- Sends each image back to the user via Bird API
- Includes page numbers for multi-page PDFs
- Cleans up temporary files

## Webhook Configuration

### Bird Dashboard Setup

1. **Login to Bird Dashboard**
2. **Go to Settings → Webhooks**
3. **Add New Webhook**:
   - **URL**: `https://your-domain.com/api/bird/pdf-webhook`
   - **Events**: Select `whatsapp.inbound`
   - **Method**: POST
   - **Status**: Active

### Webhook Payload Example

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

## Testing

### Manual Testing

1. **Test health check**:
```bash
curl http://localhost:3001/health
```

2. **Test configuration**:
```bash
curl http://localhost:3001/api/config
```

3. **Test PDF conversion**:
```bash
curl -X POST http://localhost:3001/api/test-pdf-conversion \
  -H "Content-Type: application/json" \
  -d '{
    "pdfUrl": "https://example.com/test.pdf",
    "phoneNumber": "+201016666348"
  }'
```

### Automated Testing

Run the full test suite:
```bash
node test-pdf-conversion.js
```

## Deployment

### Using PM2 (Recommended)

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

```bash
# Build image
docker build -t bird-pdf-service .

# Run container
docker run -d \
  --name bird-pdf-service \
  -p 3001:3001 \
  -e BIRD_API_KEY=your_key \
  -e BIRD_WORKSPACE_ID=your_workspace \
  -e BIRD_CHANNEL_ID=your_channel \
  bird-pdf-service
```

### Using Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api/bird/pdf-webhook {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring

### Health Checks

```bash
# Service health
curl http://localhost:3001/health

# Configuration status
curl http://localhost:3001/api/config
```

### Logs

```bash
# PM2 logs
pm2 logs bird-pdf-service

# Docker logs
docker logs bird-pdf-service
```

### File Cleanup

```bash
# Manual cleanup
curl -X POST http://localhost:3001/api/cleanup
```

## Troubleshooting

### Common Issues

1. **PDF conversion fails**:
   - Check if poppler-utils is installed
   - Verify PDF URL is accessible
   - Check disk space

2. **Bird API errors**:
   - Verify API credentials
   - Check network connectivity
   - Review API rate limits

3. **Webhook not receiving**:
   - Check webhook URL configuration
   - Verify ngrok tunnel (if using)
   - Check firewall settings

### Debug Mode

```bash
# Enable debug logging
DEBUG=pdf-service node server.js

# Check service logs
pm2 logs bird-pdf-service --lines 100
```

## Security Considerations

1. **API Keys**: Store securely in environment variables
2. **File Access**: Limit access to temp and output directories
3. **Rate Limiting**: Implement rate limiting for webhook endpoints
4. **Validation**: Validate webhook payloads before processing

## Performance Optimization

1. **Image Optimization**: Images are automatically optimized for WhatsApp
2. **File Cleanup**: Automatic cleanup of old files
3. **Memory Management**: Proper cleanup of temporary files
4. **Error Handling**: Graceful error handling and user notifications

## Support

For issues and questions:
1. Check the logs for error messages
2. Verify configuration with `/api/config`
3. Test with the provided test suite
4. Review the Bird API documentation

## License

MIT License - see LICENSE file for details.
