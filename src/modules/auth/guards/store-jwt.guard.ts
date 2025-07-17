/* eslint-disable @typescript-eslint/no-unused-vars */
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';

export interface JwtPayload {
  userId: number;
  email: string;
  roleId: number;
  roleName: string;
  permissions: string[];
  storeId: number;
  storeUserId: number;
  canCreateStore: boolean;
}

@Injectable()
export class StoreJwtGuard extends AuthGuard('store-jwt') {
  constructor(private readonly requestContextService: RequestContextService) {
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
      throw err || new UnauthorizedException();
    }

    // Cast pour accéder aux propriétés connues (JwtPayload)
    const payload = user as unknown as JwtPayload;

    this.requestContextService.setContext({
      userId: payload.userId ?? null,
      email: payload.email ?? null,
      roleId: payload.roleId ?? null,
      roleName: payload.roleName ?? null,
      permissions: payload.permissions ?? [],
      storeId: payload.storeId ?? null,
      storeUserId: payload.storeUserId ?? null,
      canCreateStore: payload.canCreateStore ?? false,
    });

    return user;
  }
}
