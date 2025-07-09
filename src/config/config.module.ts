// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validationSchema } from './env.validation';
import { ConfigService } from './config.service';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // Made available everywhere in the app
      validationSchema,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
