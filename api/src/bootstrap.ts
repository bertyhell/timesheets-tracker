// Must stay first: shims a Node built-in that dbus-next's socket layer needs at import time.
import './shared/node-compat';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import pkg from '../package.json';
import { APP_PORT } from './app.const';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/all-exceptions.filter';
import { isAllowedOrigin, localOnlyMiddleware } from './shared/local-only';
import { logger } from './shared/logger';

const APP_TITLE = 'TimesheetsTracker';

/**
 * Bootstraps the NestJS server.
 * Called from api/src/main.ts (web-service mode) or from
 * src/electron/main.ts (desktop mode, spawned as a child process).
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

  app.useGlobalFilters(new AllExceptionsFilter(app.getHttpAdapter()));
  app.use(localOnlyMiddleware);
  app.enableCors({
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
  });

  logger.info('start listening on port ' + APP_PORT);
  // Loopback only: the API has no auth, so it must not be reachable from the network
  await app.listen(APP_PORT, '127.0.0.1');
  logger.info('Service started on port: ' + APP_PORT);
}
