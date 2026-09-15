import { Injectable } from '@nestjs/common';

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
