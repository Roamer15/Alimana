import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { MyLoggerModule } from './my-logger/my-logger.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    MyLoggerModule,
    AuthModule,
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        type: 'postgres',
        host: configService.dbHost,
        port: configService.dbPort,
        username: configService.dbUsername,
        password: configService.dbPassword,
        database: configService.dbName,
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.typeormLogging,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
