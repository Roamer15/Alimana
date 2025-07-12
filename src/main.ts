import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MyLoggerService } from './my-logger/my-logger.service';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new MyLoggerService();
  const app = await NestFactory.create(AppModule, { logger });

  app.enableShutdownHooks();
  logger.log('Starting Alimana backend application...');

  // Register the global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  app.use(cookieParser()); // Enable the cookie-parser middleware

  app.setGlobalPrefix('api'); // Prefix all routes with /api (e.g., /users becomes /api/users)

  // Apply ValidationPipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform incoming data into DTO instances (required for class-validator)
      whitelist: true, // Remove any properties that do not have decorators in the DTO
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are found in the request
      disableErrorMessages: false, // Set to true in production to hide detailed error messages
    }),
  );

  // app.enableCors({
  //   origin: true, // Ou spécifiez des origines spécifiques: ['http://localhost:3000', 'https://your-frontend.com']
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //   credentials: true, // Permet l'envoi de cookies et d'en-têtes d'autorisation
  // });

  await app.listen(process.env.PORT ?? 3000);

  process.on('SIGTERM', () => {
    void (async () => {
      logger.log('SIGTERM signal received: closing application...');
      await app.close();
      logger.log('Application closed gracefully.');
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

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
