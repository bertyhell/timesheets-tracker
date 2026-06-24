import * as util from 'util';
import { logger } from './shared/logger';
import { bootstrap } from './bootstrap';

// Entry point for web-service mode (nest start).
// from ./bootstrap and this file is never executed.
bootstrap().catch((err) => {
  logger.error(
    util.inspect({
      message: 'Failed to start timesheet tracker nestjs service',
      innerException: err,
    })
  );
});
