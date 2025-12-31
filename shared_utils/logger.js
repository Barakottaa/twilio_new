const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const createLogger = (serviceName) => {
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
      //
      // - Write all logs with importance level of `error` or less to `error.log`
      // - Write all logs with importance level of `info` or less to `combined.log`
      //
      new DailyRotateFile({
        filename: path.join(logDirectory, '%DATE%-error.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'error'
      }),
      new DailyRotateFile({
        filename: path.join(logDirectory, '%DATE%-combined.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d'
      })
    ]
  });
};

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  // We can't add to the logger instance directly here easily because we return a factory function.
  // Instead, we'll let the standard config handle it, or the consumer can add it.
  // Actually, let's fix the factory to include console by default for non-prod.
}

const getLogger = (serviceName) => {
    const logger = createLogger(serviceName);
    
    // Always add console transport for now for better dev experience
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
        )
    }));

    return logger;
};

module.exports = getLogger;
