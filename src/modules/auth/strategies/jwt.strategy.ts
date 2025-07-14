import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport'; //La classe de base de NestJS pour créer des stratégies Passport.
/**ExtractJwt: Un utilitaire de passport-jwt pour extraire le JWT de différentes manières (en-tête, corps, cookie, etc.).

Strategy: La classe de stratégie JWT de base de passport-jwt. */
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../../../config/config.service';
import { User } from 'src/entities/User.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { throwHttpError } from 'src/common/errors/http-exception.helper';

// Payload pour le JWT global de l'utilisateur (doit correspondre à celui du contrôleur)
export interface JwtPayload {
  userId: number; // userId
  email: string;
  canCreateStore: boolean;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: AppConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    const jwtSecret = configService.jwtSecret;
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
            token = request.cookies['access_token'] as string;
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Valide le payload du JWT global de l'utilisateur.
   * @param payload Le payload extrait du JWT.
   * @returns Un objet représentant l'utilisateur validé (payload pour req.user).
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.usersRepository.findOne({ where: { id: payload.userId } });
    if (!user) {
      // Utilisation de throwHttpError pour une erreur cohérente
      throwHttpError(ErrorCode.INVALID_CREDENTIALS, {
        reason: 'User not found based on JWT payload.',
      });
    }
    // Retourne le payload directement comme objet utilisateur pour l'accès global
    // Assurez-vous que la structure correspond à UserJwtPayload du contrôleur
    return {
      userId: payload.userId,
      email: payload.email,
      canCreateStore: payload.canCreateStore,
    };
  }
}
