/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
        (req: any) => {
          // 2. Authorization header
          const authHeader = req?.headers?.authorization;
          // console.log(`hesder ⚠️⚠️⚠️⚠️⚠️⚠️⚠️extriare ${authHeader}`);

          if (authHeader && authHeader.startsWith('Bearer ')) {
            const headerToken = authHeader.slice(7);
            console.log('Access token (header):', headerToken); // DEBUG
            // console.log(`token ⚠️⚠️⚠️⚠️⚠️⚠️⚠️extriare ${headerToken}`);
            return headerToken;
          }

          return null;
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
    if (
      !payload.storeId ||
      !payload.storeUserId ||
      !payload.roleId ||
      !Array.isArray(payload.permissions)
    ) {
      throwHttpError(ErrorCode.UNAUTHORIZED, {
        reason: 'Jeton d’accès boutique manquant ou incomplet.',
        details: payload,
      });
    }

    // Validation de base : s'assurer que store_user_id existe et est lié à l'user_id global
    const storeUser = await this.storeUsersRepository.findOne({
      where: { id: payload.storeUserId, user: { id: payload.userId } },
      relations: ['user', 'store', 'role', 'role.permissions'], // Charger les relations nécessaires pour la validation et le payload
    });

    if (!storeUser) {
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

    return {
      userId: payload.userId,
      email: storeUser.user.email,
      canCreateStore: storeUser.user.canCreateStore,
      storeUserId: payload.storeUserId,
      storeId: payload.storeId,
      roleId: storeUser.role.id, // S'assurer que les données du rôle sont à jour
      roleName: storeUser.role.name, // S'assurer que les données du rôle sont à jour
      permissions: storeUser.role.permissions.map((permission: Permission) => permission.key), // S'assurer que les données du rôle sont à jour
    };
  }
}
