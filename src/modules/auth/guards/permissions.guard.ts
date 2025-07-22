import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { StoreUserJwtPayload } from '../auth.controller'; // Assurez-vous d'importer le bon payload
import { MyLoggerService } from 'src/my-logger/my-logger.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly logger: MyLoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true; // Si aucune permission n'est spécifiée, l'accès est autorisé
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { user } = context.switchToHttp().getRequest();
    console.log(`utlisateur qui authrntifier dans la boutique ${JSON.stringify(user, null)}`);

    // Le guard de permission est utilisé avec StoreJwtGuard, donc user est StoreUserJwtPayload
    const storeUser = user as StoreUserJwtPayload;

    if (!storeUser || !storeUser.permissions) {
      throw new ForbiddenException(
        'Permissions utilisateur non définies ou jeton invalide pour la vérification des permissions.',
      );
    }

    // Vérifie si l'utilisateur possède toutes les permissions requises
    const hasAllRequiredPermissions = requiredPermissions.every((perm) =>
      storeUser.permissions.includes(perm),
    );

    if (!hasAllRequiredPermissions) {
      throw new ForbiddenException(
        `Accès refusé. Permissions insuffisantes. Permissions requises: ${requiredPermissions.join(', ')}.`,
      );
      this.logger.warn(
        `Accès refusé pour l'utilisateur ${storeUser.userId}. Permissions requises : ${JSON.stringify(requiredPermissions, null)}`,
      );
    }

    return true;
  }
}
