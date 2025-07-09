import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfigModule } from './config/config.module'; // centralized module
import { ConfigService } from './config/config.service'; //  service typé

// import { MyLoggerModule } from './my-logger/my-logger.module';

@Module({
  imports: [
    // Uses the centralized configuration module with Joi validation
    ConfigModule,

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.dbHost,
        port: configService.dbPort,
        username: configService.dbUsername,
        password: configService.dbPassword,
        database: configService.dbName,
        autoLoadEntities: true,
        synchronize: false, //  Always disabled in production
        logging: configService.typeormLogging,
      }),
    }),
    // MyLoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
