import winston from 'winston';
import NodeWindows from 'node-windows';
import { isProduction } from '../app.const';

const eventLogger = new NodeWindows.EventLogger('Timesheet tracker');

const fileAndConsoleLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      dirname: 'c:/',
      filename: 'timesheet-tracker-log-error.log',
      level: 'error',
    }),
    new winston.transports.File({
      dirname: 'c:/',
      filename: 'c:/timesheet-tracker-log-combined.log',
    }),
  ],
});

export const logger = isProduction() ? eventLogger : fileAndConsoleLogger;
