/**
 * Configuration file for Lab Reports Processor
 * 
 * This file contains all the configuration settings that can be easily modified
 * without changing the main processing logic.
 */

module.exports = {
  // Database connection settings
  database: {
    user: 'ldm',
    password: 'ar8mswin1256',
    connectString: 'ldm',
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1
  },
  
  // Bird API configuration
  bird: {
    accessKey: 'EpYiBbBDjQv6U5oSty2Bxu8Ix5T9XOr9L2fl',
    workspaceId: '2d7a1e03-25e4-401e-bf1e-0ace545673d7',
    channelId: '8e046034-bca7-5124-89d0-1a64c1cbe819',
    templateProjectId: '9f559328-c329-4c9a-8667-b7cec45ea646', // new_pdf_clone template with buttons
    templateVersion: 'b7ab0ea0-358c-4e34-bafb-34d47a71b633' // new_pdf_clone template version
  },
  
  // File and path configuration
  paths: {
    resultsFolder: 'D:\\Results',
    reportsPath: '\\\\192.168.1.100\\LDM\\',
    logsFolder: 'C:\\scripts\\logs',
    tempFolder: 'C:\\temp\\lab-reports'
  },
  
  // Processing configuration
  processing: {
    branchCode: 2,
    timeoutSeconds: 300,
    maxRetries: 3,
    retryDelayMs: 5000,
    maxConcurrentRegistrations: 1
  },
  
  // Report generation settings
  reports: {
    defaultPrintedBy: 'Baraka',
    reportTimeout: 60000, // 60 seconds
    ghostscriptPath: 'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64.exe', // Ghostscript executable path
    rwrunPath: 'C:\\orant\\BIN\\RWRUN60.EXE' // Oracle Reports executable path
  },
  
  // WhatsApp settings
  whatsapp: {
    locale: 'ar', // Arabic locale
    uploadTimeout: 60000, // 60 seconds for file upload
    sendTimeout: 30000 // 30 seconds for message send
  },
  
  // Logging configuration
  logging: {
    level: 'INFO', // DEBUG, INFO, WARN, ERROR
    maxLogFiles: 30, // Keep last 30 days of logs
    logRotation: true
  },
  
  // Phone number formatting
  phone: {
    defaultCountryCode: '+20', // Egypt
    allowedFormats: ['0XXXXXXXXX', '+20XXXXXXXXX', 'XXXXXXXXXX']
  }
};
