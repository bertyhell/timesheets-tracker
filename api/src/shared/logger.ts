import winston from 'winston';

const fileAndConsoleLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      dirname: 'logs',
      filename: 'timesheet-tracker-log-error.log',
      level: 'error',
    }),
    new winston.transports.File({
      dirname: './',
      filename: './timesheet-tracker-log-combined.log',
    }),
  ],
});

export const logger = fileAndConsoleLogger;
