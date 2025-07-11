import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../config/config.service';
import { AuthService } from '../auth.service';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: AppConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.googleClientID;
    const clientSecret = configService.googleSecretID;
    const callbackURL = configService.callBackUrl;

    if (!clientID || !clientSecret || !callbackURL) {
      // Utilisation de throwHttpError pour une erreur cohérente
      throwHttpError(ErrorCode.INTERNAL_SERVER_ERROR, {
        reason: 'Missing Google OAuth environment variables',
        details: {
          clientID: !!clientID,
          clientSecret: !!clientSecret,
          callbackURL: !!callbackURL,
        },
      });
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  /**
   * Valide le profil utilisateur de Google.
   * @param accessToken Le jeton d'accès fourni par Google.
   * @param refreshToken Le jeton de rafraîchissement fourni par Google.
   * @param profile Le profil utilisateur fourni par Google.
   * @param done La fonction de rappel pour Passport.
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const user = await this.authService.findOrCreateGoogleUser(profile);
      done(null, user); // Passe l'utilisateur validé à Passport
    } catch (error) {
      // Passer l'erreur à la fonction done. Passport gérera l'exception.
      // Si l'erreur est une HttpException (levée par throwHttpError), Passport la propagera.
      done(error instanceof Error ? error : new Error(String(error)), undefined);
    }
  }
}
