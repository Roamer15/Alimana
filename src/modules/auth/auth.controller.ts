// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  UseGuards,
  Req,
  Get,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
// import { LoginDto } from './dto/login.dto';
import { Response, Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SelectStoreDto } from './dto/select-store.dto';
import { AppConfigService } from '../../config/config.service';
import { StoreJwtGuard } from './guards/store-jwt.guard';
import { User } from 'src/entities/User.entity';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';

// --- Interfaces pour la typage des payloads JWT et des requêtes ---

// Payload pour le JWT global de l'utilisateur
interface UserJwtPayload {
  userId: number; // userId
  email: string;
  canCreateStore: boolean;
}

// Payload pour le JWT spécifique à la boutique
interface StoreUserJwtPayload {
  userId: number; // userId
  email: string;
  canCreateStore: boolean;
  storeUserId: number;
  storeId: number;
  roleId: number;
  roleName: string;
  permissions: string[]; // Exemple: tableau de noms de permissions
}

// Interfaces pour étendre l'objet Request d'Express avec des types de 'user' spécifiques
interface LocalAuthRequest extends ExpressRequest {
  user: User; // Après LocalStrategy, req.user est l'entité User
}

interface GoogleAuthRequest extends ExpressRequest {
  user: User; // Après GoogleStrategy, req.user est l'entité User
}

interface JwtAuthRequest extends ExpressRequest {
  user: UserJwtPayload; // Après JwtAuthGuard, req.user est le payload du token global
}

interface StoreJwtAuthRequest extends ExpressRequest {
  user: StoreUserJwtPayload; // Après StoreJwtGuard, req.user est le payload du token de boutique
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: AppConfigService,
  ) {}

  // --- 1. Création de compte ---
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.registerLocal(registerDto);
    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    const accessTokenExpirationMs = this.configService.jwtAccesTokenExpirationMs;
    const refreshTokenExpirationMs = this.configService.jwtRefrehTokenExpirationMs;

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(accessTokenExpirationMs),
      sameSite: 'strict',
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(refreshTokenExpirationMs),
      sameSite: 'strict',
    });

    return { message: 'Registration successful' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: GoogleAuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user; // User est maintenant correctement typé
    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    const accessTokenExpirationMs = this.configService.jwtAccesTokenExpirationMs;
    const refreshTokenExpirationMs = this.configService.jwtRefrehTokenExpirationMs;

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(accessTokenExpirationMs),
      sameSite: 'strict',
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(refreshTokenExpirationMs),
      sameSite: 'strict',
    });

    // Rediriger vers une page de succès du frontend ou retourner un message de succès
    res.redirect('/dashboard'); // Ou return { message: 'Google login successful' };
  }

  // --- 2. Authentification ---
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local')) // Utilise la stratégie locale pour la connexion username/password
  async login(@Req() req: LocalAuthRequest, @Res({ passthrough: true }) res: Response) {
    const user = req.user; // User est maintenant correctement typé
    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    const accessTokenExpirationMs = this.configService.jwtAccesTokenExpirationMs;
    const refreshTokenExpirationMs = this.configService.jwtRefrehTokenExpirationMs;

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(accessTokenExpirationMs),
      sameSite: 'strict',
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(refreshTokenExpirationMs),
      sameSite: 'strict',
    });

    return { message: 'Login successful' };
  }

  // --- 4. Sélection de boutique ---
  @Post('select-store')
  @UseGuards(JwtAuthGuard) // L'utilisateur doit être authentifié globalement en premier
  @HttpCode(HttpStatus.OK)
  async selectStore(
    @Req() req: JwtAuthRequest, // req.user est maintenant UserJwtPayload
    @Body() selectStoreDto: SelectStoreDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.userId; // Accès sécurisé à l'ID utilisateur depuis le payload JWT
    const { accessToken, refreshToken } = await this.authService.selectStore(
      userId,
      selectStoreDto.store_user_id,
    );

    const accessTokenExpirationMs = this.configService.jwtAccesTokenExpirationMs;
    const refreshTokenExpirationMs = this.configService.jwtRefrehTokenExpirationMs;

    // Mettre à jour les cookies avec les nouveaux tokens (le store_access_token est le nouveau access_token)
    res.cookie('access_token', accessToken, {
      // Mettre à jour le token global
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(accessTokenExpirationMs),
      sameSite: 'strict',
    });
    res.cookie('refresh_token', refreshToken, {
      // Mettre à jour le refresh token
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(refreshTokenExpirationMs),
      sameSite: 'strict',
    });

    return { message: 'Store selected successfully' };
  }

  // --- 6. Refresh Token ---
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken = req.cookies?.['refresh_token']; // Accès sécurisé aux cookies
    if (!refreshToken || typeof refreshToken !== 'string') {
      throwHttpError(ErrorCode.INVALID_CREDENTIALS, {
        reason: 'Jeton de rafraîchissement non trouvé ou invalide.',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(refreshToken);

    const accessTokenExpirationMs = this.configService.jwtAccesTokenExpirationMs;
    const refreshTokenExpirationMs = this.configService.jwtRefrehTokenExpirationMs;

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(accessTokenExpirationMs),
      sameSite: 'strict',
    });
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(refreshTokenExpirationMs),
      sameSite: 'strict',
    });

    return { message: 'Tokens refreshed successfully' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken = req.cookies?.['refresh_token']; // Accès sécurisé aux cookies
    if (refreshToken && typeof refreshToken === 'string') {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    // Si 'store_access_token' est un cookie séparé, assurez-vous de le clear aussi
    res.clearCookie('store_access_token', {
      // Supposant que vous avez un cookie spécifique pour le contexte de la boutique
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return { message: 'Logged out successfully' };
  }

  // Exemple d'une route protégée utilisant le jeton d'accès global
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: JwtAuthRequest) {
    // req.user est maintenant UserJwtPayload
    return req.user; // Contient { sub (userId), email, canCreateStore }
  }

  // Exemple d'une route protégée utilisant le jeton d'accès spécifique à la boutique
  @Get('store-dashboard')
  @UseGuards(StoreJwtGuard)
  getStoreDashboard(@Req() req: StoreJwtAuthRequest) {
    // req.user est maintenant StoreUserJwtPayload
    return req.user; // Contient { userId, storeUserId, storeId, roleId, roleName, permissions }
  }
}
