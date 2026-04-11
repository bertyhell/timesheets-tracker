import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import pkg from '../package.json';
import { logger } from './shared/logger';
import * as util from 'util';
import { APP_PORT } from './app.const';

const APP_TITLE = 'TimesheetsTracker';

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

bootstrap().catch((err) => {
  logger.error(
    util.inspect({
      message: 'Failed to start timesheet tracker nestjs service',
      innerException: err,
    })
  );
});
