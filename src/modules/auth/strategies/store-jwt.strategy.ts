/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { StoreUser, StoreUserStatus } from 'src/entities/store-user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { Permission } from 'src/entities/permission.entity';

export interface StoreJwtPayload {
  userId: number; // user_id global
  email: string;
  canCreateStore: boolean;
  storeUserId: number;
  storeId: number;
  roleId: number;
  roleName: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class StoreJwtStrategy extends PassportStrategy(Strategy, 'store-jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(StoreUser)
    private storeUsersRepository: Repository<StoreUser>,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throwHttpError(ErrorCode.INTERNAL_SERVER_ERROR, {
        reason: 'JWT_SECRET environment variable is not defined.',
      });
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          // Utilisation de 'any' ici pour l'objet request d'Express
          let token: string | null = null;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (request && request.cookies) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            token = request.cookies['access_token'] as string; // Utilise 'access_token' car c'est le token mis à jour après selectStore
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Valide le payload du JWT spécifique à la boutique.
   * @param payload Le payload extrait du JWT.
   * @returns Un objet représentant l'utilisateur validé dans le contexte de la boutique (payload pour req.user).
   */
  async validate(payload: StoreJwtPayload): Promise<StoreJwtPayload> {
    // Validation de base : s'assurer que store_user_id existe et est lié à l'user_id global
    const storeUser = await this.storeUsersRepository.findOne({
      where: { id: payload.storeUserId, user: { id: payload.userId } },
      relations: ['user', 'store', 'role', 'role.permissions'], // Charger les relations nécessaires pour la validation et le payload
    });

    if (!storeUser) {
      // Utilisation de throwHttpError pour une erreur cohérente
      throwHttpError(ErrorCode.INVALID_CREDENTIALS, {
        reason: "Jeton d'accès à la boutique invalide ou non associé à l'utilisateur.",
        details: { storeUserId: payload.storeUserId, userId: payload.userId },
      });
    }

    // Vérifier le statut de l'utilisateur dans la boutique
    if (storeUser.status !== StoreUserStatus.ACTIVE) {
      throwHttpError(ErrorCode.FORBIDDEN, {
        reason: 'Votre accès à cette boutique est désactivé ou en attente.',
        details: { storeUserId: storeUser.id, status: storeUser.status },
      });
    }

    // Retourne le payload directement comme objet utilisateur pour l'accès spécifique à la boutique
    // Assurez-vous que la structure correspond à StoreUserJwtPayload du contrôleur
    return {
      userId: payload.userId,
      email: storeUser.user.email,
      canCreateStore: storeUser.user.canCreateStore,
      storeUserId: payload.storeUserId,
      storeId: payload.storeId,
      roleId: storeUser.role.id, // S'assurer que les données du rôle sont à jour
      roleName: storeUser.role.name, // S'assurer que les données du rôle sont à jour
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      permissions: storeUser.role.permissions.map((permission: Permission) => permission.name), // S'assurer que les données du rôle sont à jour
    };
  }
}

/**
 * PassportStrategy: La classe de base de NestJS.

Strategy: La stratégie JWT de passport-jwt.

'store-jwt': C'est le nom unique de cette stratégie.
 Lorsque vous utilisez des gardes (@UseGuards(AuthGuard('store-jwt'))),
  ce nom est utilisé pour dire à Passport quelle stratégie appliquer pour 
  les routes nécessitant un accès au magasin.

  return {
      userId: payload.sub,
      storeUserId: payload.store_user_id,
      storeId: payload.store_id,
      roleId: payload.role_id,
      roleName: payload.role_name,
      permissions: payload.permissions,
    };
 */
