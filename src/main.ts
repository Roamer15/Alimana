import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MyLoggerService } from './my-logger/my-logger.service';

async function bootstrap() {
  const logger = new MyLoggerService();
  const app = await NestFactory.create(AppModule, { logger });
  logger.log('Starting Alimana backend application...');
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
