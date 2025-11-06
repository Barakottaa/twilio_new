import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Get today's date for log file name (YYYY-MM-DD format)
const today = new Date().toISOString().slice(0, 10);
const logFile = path.join(logDir, `server-${today}.log`);

// Create write stream (append mode)
const stream = fs.createWriteStream(logFile, { flags: 'a' });

// Log levels
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

function formatLogEntry(level: LogLevel, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const entry: LogEntry = {
    timestamp,
    level,
    message,
    ...(data && { data })
  };
  
  return JSON.stringify(entry) + '\n';
}

export function log(level: LogLevel, message: string, data?: any) {
  const logLine = formatLogEntry(level, message, data);
  
  // Write to file
  stream.write(logLine);
  
  // Also write to console with emoji for visibility
  const emoji = {
    [LogLevel.INFO]: '📝',
    [LogLevel.WARN]: '⚠️',
    [LogLevel.ERROR]: '❌',
    [LogLevel.DEBUG]: '🔍'
  }[level];
  
  if (data) {
    console.log(`${emoji} [${level}] ${message}`, data);
  } else {
    console.log(`${emoji} [${level}] ${message}`);
  }
}

// Convenience functions
export function logInfo(message: string, data?: any) {
  log(LogLevel.INFO, message, data);
}

export function logWarn(message: string, data?: any) {
  log(LogLevel.WARN, message, data);
}

export function logError(message: string, data?: any) {
  log(LogLevel.ERROR, message, data);
}

export function logDebug(message: string, data?: any) {
  log(LogLevel.DEBUG, message, data);
}

// Log Twilio webhook requests specifically
export function logTwilioWebhook(webhookType: string, params: any) {
  logInfo(`📨 Twilio Webhook Received: ${webhookType}`, {
    type: webhookType,
    timestamp: new Date().toISOString(),
    params: params,
    // Extract key fields for quick reference
    conversationSid: params.ConversationSid || params.conversationSid,
    messageSid: params.MessageSid || params.messageSid,
    author: params.Author || params.author,
    profileName: params.ProfileName || params.profileName,
    body: params.Body || params.body,
    from: params.From || params.from,
    to: params.To || params.to,
    status: params.MessageStatus || params.status
  });
}

// Get the current log file path
export function getLogFilePath(): string {
  return logFile;
}

// Get the logs directory
export function getLogsDirectory(): string {
  return logDir;
}

// Cleanup on process exit
process.on('exit', () => {
  stream.end();
});

process.on('SIGINT', () => {
  stream.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stream.end();
  process.exit(0);
});

