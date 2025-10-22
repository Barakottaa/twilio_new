# PDF Upload Tool

Simple tool for uploading PDF files and getting public URLs for use in Bird WhatsApp templates.

## 🚀 Quick Start

```bash
# Upload any PDF file
node upload-single-pdf.js "D:\Results\your-file.pdf"
```

## 📁 Available Tool

### `upload-single-pdf.js` - PDF Upload Tool
**Simple and reliable**

- Uploads to local server and uses existing ngrok tunnel
- Accepts any file path as command line argument
- Copies file to public-pdfs directory
- Automatically detects ngrok tunnels
- Clear output and error messages

**Usage:**
```bash
node upload-single-pdf.js "D:\Results\your-file.pdf"
```

## 📂 Directory Structure

```
uploads/
├── upload-single-pdf.js    # PDF upload tool
├── public-pdfs/            # Local server files
│   └── [uploaded-files.pdf]
└── README.md               # This file
```

## 🎯 Use Cases

### For Bird Templates
Perfect for Bird WhatsApp templates:
```bash
node upload-single-pdf.js "D:\Results\invoice.pdf"
```

### For Development/Testing
Great for development and testing:
```bash
node upload-single-pdf.js "D:\Results\test-file.pdf"
```

## 🔧 Requirements

- Node.js with required packages (axios, form-data)
- PM2 services running
- Ngrok tunnel active

## 📝 Notes

- **Reliable**: Uses your local server with ngrok tunnel
- **Fast**: No external upload delays
- **Secure**: Files stay on your server
- **No Limits**: No file size restrictions or content filtering
- **File Types**: Currently optimized for PDF files but can handle other file types

## 🚨 Troubleshooting

### "No active ngrok tunnels found"
- Make sure PM2 services are running: `pm2 status`
- Start services: `pm2 start ecosystem.config.js`

### "File not found"
- Check the file path is correct
- Use absolute paths: `"D:\Results\filename.pdf"`

### Upload fails
- Check PM2 services are running
- Verify ngrok tunnel is active
- Check file is not corrupted
