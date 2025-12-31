# Lab Reports Service

## Overview
Node.js service that processes lab reports and sends them via WhatsApp using Bird API. This service replaces the Oracle Forms procedure.

## Features
- Processes lab registrations from Oracle database
- Generates PDF reports using Oracle Reports
- Merges multiple PDFs into single file
- Sends reports via WhatsApp using Bird API
- Handles phone number formatting
- Automatic retry and error handling

## Configuration
Edit `config.js` to modify:
- Database connection settings
- Bird API credentials
- File paths
- Processing parameters

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
- Oracle Instant Client
- Oracle Reports (RWRUN60.EXE)
- Ghostscript for PDF merging
- Node.js 16+

## API Endpoints
- Continuous processing mode (runs every 2 minutes)
- Automatic database updates
- Comprehensive logging

## Logs
Logs are written to `../logs/lab-reports_YYYY-MM-DD.log`
