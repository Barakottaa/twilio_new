/**
 * Advanced Logger utility for Bird Service
 * Provides structured logging with organized folder structure and date/time-based files
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(serviceName = 'listener') {
    this.serviceName = serviceName;
    this.logDir = path.join(__dirname, 'logs', serviceName);
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  getDateTimeString() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').split('.')[0]; // YYYY-MM-DDTHH-MM-SS
  }

  getLogFileName(level) {
    const dateString = this.getDateString();
    return `${level}-${dateString}.log`;
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      data
    };
    return JSON.stringify(logEntry);
  }

  writeToFile(filename, message) {
    const logFile = path.join(this.logDir, filename);
    fs.appendFileSync(logFile, message + '\n');
  }

  info(message, data = null) {
    const formatted = this.formatMessage('INFO', message, data);
    console.log(`ℹ️ [${this.serviceName}] ${message}`, data ? data : '');
    this.writeToFile(this.getLogFileName('info'), formatted);
  }

  success(message, data = null) {
    const formatted = this.formatMessage('SUCCESS', message, data);
    console.log(`✅ [${this.serviceName}] ${message}`, data ? data : '');
    this.writeToFile(this.getLogFileName('success'), formatted);
  }

  error(message, data = null) {
    const formatted = this.formatMessage('ERROR', message, data);
    console.error(`❌ [${this.serviceName}] ${message}`, data ? data : '');
    this.writeToFile(this.getLogFileName('error'), formatted);
  }

  warn(message, data = null) {
    const formatted = this.formatMessage('WARN', message, data);
    console.warn(`⚠️ [${this.serviceName}] ${message}`, data ? data : '');
    this.writeToFile(this.getLogFileName('warn'), formatted);
  }

  debug(message, data = null) {
    const formatted = this.formatMessage('DEBUG', message, data);
    console.log(`🔍 [${this.serviceName}] ${message}`, data ? data : '');
    this.writeToFile(this.getLogFileName('debug'), formatted);
  }

  request(message, data = null) {
    const formatted = this.formatMessage('REQUEST', message, data);
    console.log(`📩 [${this.serviceName}] ${message}`, data ? data : '');
    this.writeToFile(this.getLogFileName('requests'), formatted);
  }

  response(message, data = null) {
    const formatted = this.formatMessage('RESPONSE', message, data);
    console.log(`📤 [${this.serviceName}] ${message}`, data ? data : '');
    this.writeToFile(this.getLogFileName('responses'), formatted);
  }

  // Create service-specific loggers
  static createServiceLogger(serviceName) {
    return new Logger(serviceName);
  }
}

module.exports = Logger;