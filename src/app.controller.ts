import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { throwHttpError } from './common/errors/http-exception.helper';
import { ErrorCode } from './common/errors/error-codes.enum';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    throwHttpError(ErrorCode.EMAIL_ALREADY_USED, { email: 'dhbhjb' });
    return this.appService.getHello();
  }
}
