import { ArgumentsHost, Catch, HttpException, InternalServerErrorException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import { CustomError } from './CustomError';
import { logger } from './logger';

const MAX_CAUSE_DEPTH = 10;

/**
 * Services wrap errors in CustomError for context. This filter:
 * - answers with the status of an HttpException anywhere in the cause chain (e.g. a NotFoundException
 *   wrapped in a CustomError still becomes a 404 instead of a generic 500)
 * - logs everything else once, including the CustomError context, and answers with a plain 500
 */
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const httpException = findHttpException(exception);
    if (httpException) {
      super.catch(httpException, host);
      return;
    }

    logger.error(
      exception instanceof CustomError
        ? exception.toString()
        : exception instanceof Error
          ? (exception.stack ?? exception.toString())
          : String(exception)
    );
    super.catch(new InternalServerErrorException(), host);
  }
}

function findHttpException(exception: unknown): HttpException | null {
  let current = exception;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH && current; depth++) {
    if (current instanceof HttpException) {
      return current;
    }
    current = current instanceof Error ? current.cause : null;
  }
  return null;
}
