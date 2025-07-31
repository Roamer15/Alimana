/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../../../config/config.service';
import { User } from 'src/entities/User.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { throwHttpError } from 'src/common/errors/http-exception.helper';

export interface JwtPayload {
  userId: number;
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
          let token: string | null = null;

          if (request?.cookies?.access_token) {
            token = request.cookies.access_token;
            console.debug(`[JwtStrategy] Token extrait du cookie: ${token}`);
          } else if (request?.headers?.authorization?.startsWith('Bearer ')) {
            token = request.headers.authorization.split(' ')[1];
            console.debug(`[JwtStrategy] Token extrait du header Authorization: ${token}`);
          } else {
            console.warn(
              '[JwtStrategy] Aucun token JWT trouvé ni dans le cookie ni dans le header Authorization',
            );
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    console.debug(`[JwtStrategy] Validation du payload JWT:`, payload);

    const user = await this.usersRepository.findOne({ where: { id: payload.userId } });

    if (!user) {
      console.warn(`[JwtStrategy] Aucun utilisateur trouvé avec l'ID ${payload.userId}`);
      throwHttpError(ErrorCode.INVALID_CREDENTIALS, {
        reason: 'User not found based on JWT payload.',
      });
    }

    console.debug(`[JwtStrategy] Utilisateur validé: ID ${user.id}, email ${user.email}`);

    return {
      userId: payload.userId,
      email: payload.email,
      canCreateStore: payload.canCreateStore,
    };
  }
}
