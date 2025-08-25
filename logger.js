const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logTransport = new DailyRotateFile({
  filename: 'logs/%DATE%.log', 
  datePattern: 'YYYY-MM',       // Use 'YYYY-MM' for month-wise log files
  zippedArchive: true,        
  maxSize: '100m',
  maxFiles: '12',              // Keep logs for the last 12 months
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

const logger = winston.createLogger({
  level: 'error', 
  transports: [logTransport],
});

function logError(error, extraInfo) {
  logger.error({
    message: error?.message,
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    extraInfo: extraInfo,
  });
}

module.exports = { logError };
