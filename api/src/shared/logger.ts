import path from 'node:path';
import winston from 'winston';

// In a packaged install the api runs from a root-owned, read-only prefix
// (e.g. /opt/Timesheets Tracker/resources/api), so log files must go to the
// per-user data dir that Electron passes in. Falls back to cwd when running
// the api standalone (`npm run dev:api`).
const logDir = process.env.USER_DATA_PATH || path.resolve('./');

const fileAndConsoleLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      dirname: logDir,
      filename: 'timesheet-tracker-log-error.log',
      level: 'error',
    }),
    new winston.transports.File({
      dirname: logDir,
      filename: 'timesheet-tracker-log-combined.log',
    }),
  ],
});

export const logger = fileAndConsoleLogger;
