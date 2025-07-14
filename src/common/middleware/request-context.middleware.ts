import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../context/request-context.service';
import { JwtService } from '@nestjs/jwt'; // Pour décoder le JWT
import { AppConfigService } from 'src/config/config.service';
import { MyLoggerService } from 'src/my-logger/my-logger.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly jwtService: JwtService,
    private readonly appConfigService: AppConfigService,
    private readonly logger: MyLoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    let storeId: number | null = null;
    let storeUserId: number | null = null;
    let userId: number | null = null;

    // Tente de décoder le JWT pour récupérer storeId et storeUserId
    const cookies = req.cookies as Record<string, string | undefined>;
    let accessToken: string | undefined = cookies['access_token'];

    if (!accessToken && typeof req.headers['authorization'] === 'string') {
      // Extraire le token du header Authorization: Bearer <token>
      accessToken = req.headers['authorization'].split(' ')[1];
    }

    interface JwtPayload {
      storeId?: number;
      storeUserId?: number;
      userId?: number;
    }

    if (accessToken) {
      try {
        const payload = this.jwtService.verify<JwtPayload>(accessToken, {
          secret: this.appConfigService.jwtSecret,
        });

        storeId = payload.storeId ?? null;
        storeUserId = payload.storeUserId ?? null;
        userId = payload.userId ?? null;
      } catch (error: unknown) {
        const err = error as Error;
        this.logger.error(
          `Failed to verify token to move the payload information to RequestContext : ${err.message}`,
          err.stack,
          'RequestContextMiddleware',
        );
      }
    }

    this.requestContextService.setContext({
      ipAddress,
      userAgent,
      storeId,
      storeUserId,
      userId,
    });

    next();
  }
}
