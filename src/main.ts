import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MyLoggerService } from './my-logger/my-logger.service';

async function bootstrap() {
  const logger = new MyLoggerService();
  const app = await NestFactory.create(AppModule, { logger });

  app.enableShutdownHooks();
  logger.log('Starting Alimana backend application...');
  await app.listen(process.env.PORT ?? 3000);

  process.on('SIGTERM', () => {
    void (async () => {
      logger.log('SIGTERM signal received: closing application...');
      await app.close();
      logger.log('Application cloud gracefully.');
      process.exit(0);
    })();
  });

  process.on('SIGINT', () => {
    void (async () => {
      logger.log('SIGINT signal received: closing application...');
      await app.close();
      logger.log('Application closed gracefully.');
    })();
  });
}

bootstrap();
