/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  SerializeOptions,
  Patch,
  // Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Response, Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SelectStoreDto } from './dto/select-store.dto';
import { AppConfigService } from '../../config/config.service';
import { StoreJwtGuard } from './guards/store-jwt.guard';
import { User } from 'src/entities/User.entity';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { MyLoggerService } from '../../my-logger/my-logger.service';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { plainToInstance } from 'class-transformer';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

// --- Interfaces pour la typage des payloads JWT et des requêtes ---

interface UserJwtPayload {
  userId: number;
  email: string;
  canCreateStore: boolean;
}

export interface StoreUserJwtPayload {
  userId: number;
  email: string;
  canCreateStore: boolean;
  storeUserId: number;
  storeId: number;
  roleId: number;
  roleName: string;
  permissions: string[];
}

interface LocalAuthRequest extends ExpressRequest {
  user: User;
}

interface GoogleAuthRequest extends ExpressRequest {
  user: User;
}

interface JwtAuthRequest extends ExpressRequest {
  user: UserJwtPayload;
}

interface StoreJwtAuthRequest extends ExpressRequest {
  user: StoreUserJwtPayload;
}

// =============================================================================
// CONFIGURATION COOKIES HELPER
// =============================================================================
interface CookieConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  domain?: string;
  maxAge: number;
}

@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;
  private readonly frontendUrl: string;
  private readonly cookieDomain: string | undefined;

  constructor(
    private authService: AuthService,
    private configService: AppConfigService,
    private logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // En production, si tu utilises un sous-domaine commun (api.alimana.cc),
    // définis le domain pour partager les cookies
    // Sinon, laisse undefined pour l'option "tokens dans body"
    this.cookieDomain = this.isProduction
      ? process.env.COOKIE_DOMAIN // ex: '.alimana.cc' si tu as api.alimana.cc
      : undefined;
  }

  /**
   * Helper pour générer la configuration des cookies
   */
  private getCookieConfig(maxAge: number): CookieConfig {
    const config: CookieConfig = {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      path: '/',
      maxAge,
    };

    // Ajoute le domain seulement si défini (pour sous-domaine commun)
    if (this.cookieDomain) {
      config.domain = this.cookieDomain;
    }

    return config;
  }

  /**
   * Helper pour définir les cookies d'authentification
   */
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const accessTokenExpirationMs = this.configService.jwtAccesTokenExpirationMs;
    const refreshTokenExpirationMs = this.configService.jwtRefrehTokenExpirationMs;

    res.cookie('access_token', accessToken, this.getCookieConfig(Number(accessTokenExpirationMs)));
    res.cookie(
      'refresh_token',
      refreshToken,
      this.getCookieConfig(Number(refreshTokenExpirationMs)),
    );
  }

  /**
   * Helper pour effacer les cookies d'authentification
   */
  private clearAuthCookies(res: Response): void {
    const clearConfig = {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      path: '/',
      ...(this.cookieDomain && { domain: this.cookieDomain }),
    } as const;

    res.clearCookie('access_token', clearConfig);
    res.clearCookie('refresh_token', clearConfig);
    res.clearCookie('store_access_token', clearConfig);
  }

  // ===========================================================================
  // REGISTER
  // ===========================================================================
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.registerLocal(registerDto);
    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    // Set cookies (fonctionne si même domaine ou sous-domaine)
    this.setAuthCookies(res, accessToken, refreshToken);

    this.logger.log(`New user registered: ${user.email}`);

    // ✅ IMPORTANT: Retourne aussi les tokens dans le body pour cross-domain
    return {
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        canCreateStore: user.canCreateStore,
      },
    };
  }

  // ===========================================================================
  // GOOGLE OAUTH
  // ===========================================================================
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: GoogleAuthRequest,
    @Res() res: Response, // Note: pas passthrough pour pouvoir redirect
  ) {
    const user = req.user;
    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    // Set cookies (au cas où même domaine)
    this.setAuthCookies(res, accessToken, refreshToken);

    this.logger.log(`User authenticated via Google: ${user.email}`);

    // ✅ SOLUTION CROSS-DOMAIN: Passe les tokens via URL params
    // Le frontend les récupère et les stocke dans localStorage
    const redirectUrl = new URL('/callback', this.frontendUrl);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);

    // Optionnel: indique si c'est un nouvel utilisateur
    const isNewUser =
      user.createdAt && new Date().getTime() - new Date(user.createdAt).getTime() < 60000; // < 1 min
    redirectUrl.searchParams.set('isNewUser', String(isNewUser));

    res.redirect(redirectUrl.toString());
  }

  // ===========================================================================
  // LOGIN
  // ===========================================================================
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  async login(@Req() req: LocalAuthRequest, @Res({ passthrough: true }) res: Response) {
    const user = req.user;
    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    this.setAuthCookies(res, accessToken, refreshToken);

    this.logger.log(`User logged in: ${user.email}`);

    // ✅ Retourne les tokens dans le body pour cross-domain
    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        canCreateStore: user.canCreateStore,
      },
    };
  }

  // ===========================================================================
  // MY STORES
  // ===========================================================================
  @Get('my-stores')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyStores(@Req() req: JwtAuthRequest) {
    const userId = req.user.userId;
    const stores = await this.authService.findUserStores(userId);
    return { stores };
  }

  // ===========================================================================
  // SELECT STORE
  // ===========================================================================
  @Post('select-store')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async selectStore(
    @Req() req: JwtAuthRequest,
    @Body() selectStoreDto: SelectStoreDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.userId;
    const { accessToken, refreshToken } = await this.authService.selectStore(
      userId,
      selectStoreDto.storeUserId,
    );

    this.setAuthCookies(res, accessToken, refreshToken);

    this.logger.log(`User ${userId} selected store ${selectStoreDto.storeUserId}`);

    // ✅ Retourne le token pour cross-domain
    return {
      message: 'Store selected successfully',
      accessToken,
      refreshToken,
    };
  }

  // ===========================================================================
  // REFRESH TOKEN
  // ===========================================================================
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: ExpressRequest,
    @Body() body: { refreshToken?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    // ✅ Accepte le refresh token depuis le cookie OU le body
    const refreshToken = req.cookies?.['refresh_token'] || body.refreshToken;

    if (!refreshToken || typeof refreshToken !== 'string') {
      throwHttpError(ErrorCode.INVALID_CREDENTIALS, {
        reason: 'Refresh token not found or invalid.',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(refreshToken);

    this.setAuthCookies(res, accessToken, newRefreshToken);

    this.logger.log('Tokens refreshed successfully');

    // ✅ Retourne les tokens pour cross-domain
    return {
      message: 'Tokens refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  // ===========================================================================
  // LOGOUT
  // ===========================================================================
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: ExpressRequest,
    @Body() body: { refreshToken?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] || body.refreshToken;

    if (refreshToken && typeof refreshToken === 'string') {
      await this.authService.logout(refreshToken);
    }

    this.clearAuthCookies(res);

    return { message: 'Logged out successfully' };
  }

  // ===========================================================================
  // USER PROFILE ENDPOINTS
  // ===========================================================================
  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: JwtAuthRequest) {
    return req.user;
  }

  @Get('store/me')
  @UseGuards(StoreJwtGuard)
  getStoreDashboard(@Req() req: StoreJwtAuthRequest) {
    return req.user;
  }

  @Get('profile/me')
  @UseGuards(JwtAuthGuard)
  @SerializeOptions({
    groups: ['me'],
    excludeExtraneousValues: true,
  })
  async getMyProfile(@Req() req: JwtAuthRequest): Promise<UserProfileDto> {
    const user = req.user;
    const userWithRelations = await this.authService.findOneWithRelations(user.userId);
    return plainToInstance(UserProfileDto, userWithRelations);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: JwtAuthRequest, @Body() updateUserDto: Partial<UpdateUserDto>) {
    return await this.authService.update(req.user.userId, updateUserDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: JwtAuthRequest,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(req.user.userId, dto);
    return { message: 'Password changed successfully' };
  }
}
