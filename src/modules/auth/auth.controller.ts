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

// =============================================================================
// INTERFACES
// =============================================================================

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
// COOKIE CONFIGURATION TYPE
// =============================================================================

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
  path: string;
  maxAge: number;
}

// =============================================================================
// CONTROLLER
// =============================================================================

@Controller('auth')
export class AuthController {
  // Configuration centralisée
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
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    // ✅ IMPORTANT: Cookie domain pour partage entre alimana.cc et api.alimana.cc
    // Le point devant (.alimana.cc) permet le partage avec tous les sous-domaines
    this.cookieDomain =
      process.env.COOKIE_DOMAIN || (this.isProduction ? '.alimana.cc' : undefined);

    this.logger.log(
      `AuthController initialized - Production: ${this.isProduction}, Frontend: ${this.frontendUrl}, Cookie Domain: ${this.cookieDomain}`,
    );
  }

  // ===========================================================================
  // HELPER: Configuration des cookies
  // ===========================================================================

  /**
   * Génère la configuration des cookies d'authentification
   * Centralisé pour éviter les incohérences
   */
  private getCookieOptions(maxAge: number): CookieOptions {
    const options: CookieOptions = {
      httpOnly: true, // ✅ Protection XSS
      secure: this.isProduction, // ✅ HTTPS only en prod
      sameSite: this.isProduction ? 'lax' : 'lax', // ✅ 'lax' pour même domaine racine
      path: '/',
      maxAge,
    };

    // ✅ CRUCIAL: Ajoute le domain pour le partage cross-subdomain
    if (this.cookieDomain) {
      options.domain = this.cookieDomain;
    }

    return options;
  }

  /**
   * Définit les cookies d'authentification (access + refresh)
   */
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const accessMaxAge = Number(this.configService.jwtAccesTokenExpirationMs);
    const refreshMaxAge = Number(this.configService.jwtRefrehTokenExpirationMs);

    res.cookie('access_token', accessToken, this.getCookieOptions(accessMaxAge));
    res.cookie('refresh_token', refreshToken, this.getCookieOptions(refreshMaxAge));

    this.logger.log(`Auth cookies set with domain: ${this.cookieDomain || 'default'}`);
  }

  /**
   * Efface tous les cookies d'authentification
   */
  private clearAuthCookies(res: Response): void {
    const clearOptions = {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax' as const,
      path: '/',
      ...(this.cookieDomain && { domain: this.cookieDomain }),
    };

    res.clearCookie('access_token', clearOptions);
    res.clearCookie('refresh_token', clearOptions);
    res.clearCookie('store_access_token', clearOptions);

    this.logger.log('Auth cookies cleared');
  }

  // ===========================================================================
  // REGISTER
  // ===========================================================================

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.registerLocal(registerDto);
    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    // ✅ Set cookies avec la bonne configuration
    this.setAuthCookies(res, accessToken, refreshToken);

    this.logger.log(`New user registered: ${user.email}`);

    // ✅ Retourne aussi les tokens dans le body (backup cross-domain)
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
    @Res() res: Response, // Note: pas passthrough car on fait un redirect
  ) {
    const user = req.user;
    const { accessToken, refreshToken } = await this.authService.generateTokens(user);

    // ✅ Set cookies avec la bonne configuration
    this.setAuthCookies(res, accessToken, refreshToken);

    this.logger.log(`User authenticated via Google: ${user.email}`);

    // ✅ Détermine si c'est un nouvel utilisateur (créé dans les 60 dernières secondes)
    const isNewUser =
      user.createdAt && new Date().getTime() - new Date(user.createdAt).getTime() < 60000;

    // ✅ Redirect vers la bonne page selon le type d'utilisateur
    // Option 1: Redirect simple (les cookies sont déjà set)
    if (isNewUser) {
      res.redirect(`${this.frontendUrl}/create-store`);
    } else {
      res.redirect(`${this.frontendUrl}/select-store`);
    }

    // Option 2 (alternative): Passer les tokens via URL si les cookies ne marchent pas
    // const redirectUrl = new URL('/auth/callback', this.frontendUrl);
    // redirectUrl.searchParams.set('accessToken', accessToken);
    // redirectUrl.searchParams.set('refreshToken', refreshToken);
    // redirectUrl.searchParams.set('isNewUser', String(isNewUser));
    // res.redirect(redirectUrl.toString());
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

    // ✅ Set cookies avec la bonne configuration
    this.setAuthCookies(res, accessToken, refreshToken);

    this.logger.log(`User logged in: ${user.email}`);

    // ✅ Retourne aussi les tokens dans le body (backup cross-domain)
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

    // ✅ Set cookies avec la bonne configuration
    this.setAuthCookies(res, accessToken, refreshToken);

    this.logger.log(`User ${userId} selected store ${selectStoreDto.storeUserId}`);

    // ✅ Retourne aussi le token dans le body
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
    // ✅ Accepte le refresh token depuis le cookie OU le body (flexibilité)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken = req.cookies?.['refresh_token'] || body.refreshToken;

    if (!refreshToken || typeof refreshToken !== 'string') {
      throwHttpError(ErrorCode.INVALID_CREDENTIALS, {
        reason: 'Refresh token not found or invalid.',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(refreshToken);

    // ✅ Set cookies avec la bonne configuration
    this.setAuthCookies(res, accessToken, newRefreshToken);

    this.logger.log('Tokens refreshed successfully');

    // ✅ Retourne aussi les tokens dans le body
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
    // ✅ Accepte le refresh token depuis le cookie OU le body
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken = req.cookies?.['refresh_token'] || body.refreshToken;

    if (refreshToken && typeof refreshToken === 'string') {
      await this.authService.logout(refreshToken);
    }

    // ✅ Efface tous les cookies avec la bonne configuration
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
