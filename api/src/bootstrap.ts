// Must stay first: shims a Node built-in that dbus-next's socket layer needs at import time.
import './shared/node-compat';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import pkg from '../package.json';
import { APP_PORT } from './app.const';
import { AppModule } from './app.module';
import { logger } from './shared/logger';

const APP_TITLE = 'TimesheetsTracker';

/**
 * Bootstraps the NestJS server.
 * Called from api/src/main.ts (web-service mode) or from
 * src/bun/index.ts (Electrobun desktop mode).
 */
export async function bootstrap() {
  logger.info('creating nest module');
  const app = await NestFactory.create(AppModule);

  logger.info('setting up swagger');
  const config = new DocumentBuilder()
    .setTitle(APP_TITLE)
    .setDescription('API for manipulating programs and tagging them')
    .setVersion(pkg.version)
    .addServer('http://localhost:' + APP_PORT)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  logger.info('enable cors');
  app.enableCors();

  logger.info('start listening on port ' + APP_PORT);
  await app.listen(APP_PORT);
  logger.info('Service started on port: ' + APP_PORT);
}
