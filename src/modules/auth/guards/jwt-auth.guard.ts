/* eslint-disable @typescript-eslint/no-unused-vars */
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { MyLoggerService } from 'src/my-logger/my-logger.service';

export interface BasicJwtPayload {
  userId: number;
  email: string;
  canCreateStore: boolean;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly logger: MyLoggerService,
  ) {
    super();
  }

  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    _info: any,
    _context: ExecutionContext,
    _status?: any,
  ): TUser {
    if (err || !user) {
      const error = err as Error;
      this.logger.error(
        `[JwtAuthGuard] Authentication failed. Error: ${error?.message || 'Unknown'}, User: ${user ? 'present' : 'null'}`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        err?.stack,
        'JwtAuthGuard',
      );
      throw err || new UnauthorizedException('Authentication failed');
    }

    const payload = user as unknown as BasicJwtPayload;

    this.logger.log(
      `[JwtAuthGuard] User authenticated: ${JSON.stringify(payload)}`,
      'JwtAuthGuard',
    );

    const currentContext = this.requestContextService.getContext();

    this.requestContextService.setContext({
      ...currentContext,
      userId: payload.userId ?? null,
      email: payload.email ?? null,
      canCreateStore: payload.canCreateStore ?? false,
      storeId: null,
      storeUserId: null,
      roleId: null,
      roleName: null,
      permissions: [],
    });

    this.logger.log(
      `[JwtAuthGuard] Context set for user ${payload.userId}. Current context check: UserID=${this.requestContextService.getContext().userId}, Email=${this.requestContextService.getContext().email}`,
      'JwtAuthGuard',
    );

    return user;
  }
}
