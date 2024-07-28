import { Injectable } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pkg from '../package.json';

@Injectable()
export class AppService {
  status(): { status: string; version: string } {
    return {
      status: 'up',
      version: pkg.version,
    };
  }
}
