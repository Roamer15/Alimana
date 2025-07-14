// request-context.module.ts
import { Module } from '@nestjs/common';
import { RequestContextService } from './request-context.service';
import { RequestContextMiddleware } from '../middleware/request-context.middleware';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';
import { AppConfigModule } from 'src/config/config.module';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from 'src/config/config.service';

@Module({
  imports: [
    MyLoggerModule,
    AppConfigModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.jwtExpiresIn },
      }),
      inject: [AppConfigService],
    }),
  ],
  providers: [RequestContextService, RequestContextMiddleware],
  exports: [RequestContextService],
})
export class RequestContextModule {}
