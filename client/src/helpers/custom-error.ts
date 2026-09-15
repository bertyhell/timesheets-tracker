import { InternalServerErrorException } from '@nestjs/common';
import util from 'node:util';

export function customError(
  message: string,
  innerException?: any,
  additionalInfo?: Record<string, unknown>
) {
  const stack = innerException?.stack || new Error().stack || '';

  const json = util.inspect(
    {
      message,
      innerException: innerException,
      additionalInfo: additionalInfo,
      stack: stack,
    },
    {
      showHidden: false,
      depth: 20,
    }
  );

  return new InternalServerErrorException(json);
}
