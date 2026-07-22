import { Module } from '@nestjs/common';
import { RequestContextService } from './request-context.service';
import { RequestContextController } from './request-context.controller';

@Module({
  providers: [RequestContextService],
  controllers: [RequestContextController],
  exports: [RequestContextService],
})
export class RequestContextModule {}
