import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextService } from '../context/request-context/request-context.service';

@Injectable()
export class PayloadContextMiddleware implements NestMiddleware {
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly logger: MyLoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const ipAddress = req.ip || null;
    const userAgent = req.headers['user-agent'] || null;

    this.requestContextService.setContext({
      ipAddress,
      userAgent,
    });

    this.logger.log(
      `[PayloadContextMiddleware] Context initialized with IP and User-Agent. IP: ${ipAddress}, UA: ${userAgent}`,
      'Middleware',
    );

    next();
  }
}
