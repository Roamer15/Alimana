import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ForbiddenException,
  Get,
  Delete,
  Res, // Importez Res pour les cookies
} from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto, AcceptInvitationDto } from './dto/invitation.dto';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { StoreUserJwtPayload } from '../auth/auth.controller';
import { Response } from 'express'; // Importez Response d'express
import { AppConfigService } from 'src/config/config.service'; // Importez AppConfigService
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionKeys } from '../auth/decorators/permissions.decorator';
import { PermissionKey } from '../store/constants/permission-enum';

interface StoreJwtAuthRequest extends Request {
  user: StoreUserJwtPayload;
}

@Controller()
export class InvitationController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly configService: AppConfigService, // Injectez AppConfigService
  ) {}

  /**
   * Crée et envoie une invitation à un utilisateur pour rejoindre une boutique.
   * Accessible par un StoreUser avec la permission 'invite_users'.
   */
  @Post('stores/:storeId/invitations')
  @PermissionKeys(PermissionKey.INVITE_USERS)
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(StoreJwtGuard, PermissionsGuard)
  async createInvitation(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() createInvitationDto: CreateInvitationDto,
    @Req() req: StoreJwtAuthRequest,
  ) {
    if (req.user.storeId !== storeId) {
      throw new ForbiddenException(
        'Accès refusé. Vous ne pouvez envoyer des invitations que depuis votre boutique actuelle.',
      );
    }
    return this.invitationService.createInvitation(createInvitationDto);
  }

  /**
   * Accepte une invitation.
   * Cette route est publique (non protégée par StoreJwtGuard) car l'utilisateur n'est pas encore authentifié dans la boutique.
   * Elle retourne les tokens d'authentification après acceptation réussie.
   */
  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(
    @Body() acceptInvitationDto: AcceptInvitationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.invitationService.acceptInvitation(
      acceptInvitationDto.token,
      acceptInvitationDto,
    );

    const accessTokenExpirationMs = this.configService.jwtAccesTokenExpirationMs;
    const refreshTokenExpirationMs = this.configService.jwtRefrehTokenExpirationMs;

    // Définir les cookies pour les nouveaux tokens
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: accessTokenExpirationMs ? parseInt(accessTokenExpirationMs, 10) : undefined,
      sameSite: 'strict',
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: refreshTokenExpirationMs ? parseInt(refreshTokenExpirationMs, 10) : undefined,
      sameSite: 'strict',
    });

    return {
      message: 'Invitation acceptée avec succès. Vous êtes maintenant connecté à la boutique.',
    };
  }

  /**
   * Révoque une invitation en attente.
   * Accessible par un StoreUser avec la permission 'manage_users'.
   */
  @Delete('stores/:storeId/invitations/:invitationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(StoreJwtGuard, PermissionsGuard) // La permission 'manage_users' inclut la révocation
  @PermissionKeys(PermissionKey.MANAGE_USERS)
  async revokeInvitation(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('invitationId', ParseIntPipe) invitationId: number,
    @Req() req: StoreJwtAuthRequest,
  ) {
    if (req.user.storeId !== storeId) {
      throw new ForbiddenException(
        'Accès refusé. Vous ne pouvez révoquer les invitations que de votre boutique actuelle.',
      );
    }
    await this.invitationService.revokeInvitation(storeId, invitationId, req.user.storeUserId);
    return; // Retourne un 204 No Content
  }

  /**
   * Récupère toutes les invitations pour une boutique donnée.
   * Accessible par un StoreUser avec la permission 'manage_users'.
   */
  @Get('stores/:storeId/invitations')
  @HttpCode(HttpStatus.OK)
  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_USERS)
  async findAllInvitations(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Req() req: StoreJwtAuthRequest,
  ) {
    if (req.user.storeId !== storeId) {
      throw new ForbiddenException(
        'Accès refusé. Vous ne pouvez voir les invitations que de votre boutique actuelle.',
      );
    }
    return this.invitationService.findAllInvitations(storeId);
  }
}
