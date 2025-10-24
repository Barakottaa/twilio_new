# Twilio New Project

## Project Structure

```
twilio_new/
├── twilio_chat/            # Twilio Chat Application (Next.js)
│   ├── src/
│   ├── package.json
│   ├── README.md
│   └── start.bat
├── bird-service/           # Bird WhatsApp API Service
│   ├── server.js
│   ├── bird-service.js
│   ├── pdf-to-image-service.js
│   ├── ecosystem.config.js
│   ├── start-ngrok.js
│   ├── package.json
│   ├── README.md
│   └── start.bat
├── lab-reports-service/    # Lab Reports Processing Service
│   ├── process-lab-reports.js
│   ├── config.js
│   ├── package.json
│   ├── README.md
│   └── start.bat
├── logs/                   # Service logs
├── docs/                   # Documentation
└── README.md              # This file
```

## Services

### 1. Lab Reports Service
- **Location**: `lab-reports-service/`
- **Purpose**: Processes lab reports and sends via WhatsApp
- **Technology**: Node.js, Oracle database, Bird API
- **Port**: N/A (continuous processing)
- **Status**: ✅ Production Ready

### 2. Bird Service
- **Location**: `bird-service/`
- **Purpose**: Bird WhatsApp API integration with PDF conversion
- **Technology**: Express.js, PDF processing, Webhooks
- **Port**: 3001
- **Status**: ✅ Production Ready

### 3. Twilio Chat App
- **Location**: `twilio_chat/`
- **Purpose**: Next.js web application for Twilio chat
- **Technology**: Next.js, React, TypeScript
- **Port**: 3000
- **Status**: ✅ Production Ready

## Quick Start

### Start Lab Reports Service
```bash
cd lab-reports-service
npm install
npm start
```

### Start Bird Service
```bash
cd bird-service
npm install
npm start
```

### Start Twilio Chat App
```bash
cd twilio_chat
npm install
npm run dev
```

## Configuration

Each service has its own configuration:
- **Lab Reports**: `lab-reports-service/config.js`
- **Bird Service**: `bird-service/.env`
- **Twilio Chat**: Environment variables

## Health Checks

- **Lab Reports**: Check logs for processing status
- **Bird Service**: `GET http://localhost:3001/health`
- **Twilio Chat**: `GET http://localhost:3000`

## Logs

All services write logs to the `logs/` directory:
- `lab-reports_YYYY-MM-DD.log`
- `bird-combined-X.log`
- `bird-error-X.log`

## PM2 Configuration

The project uses PM2 for process management. See `bird-service/ecosystem.config.js` for configuration.

## Support

For issues or questions, check the individual service README files or contact the development team.
