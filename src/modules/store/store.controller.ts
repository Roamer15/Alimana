import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
// import { StoreUserJwtPayload, UserJwtPayload } from '../auth/auth.controller';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';
import { AppConfigService } from 'src/config/config.service';
import { MyLoggerService } from 'src/my-logger/my-logger.service';

// Interface pour étendre l'objet Request d'Express avec le payload JWT
// interface JwtAuthRequest extends ExpressRequest {
//   user: UserJwtPayload;
// }

// interface StoreJwtAuthRequest extends ExpressRequest {
//   user: StoreUserJwtPayload;
// }

@Controller('store')
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private configService: AppConfigService,
    private logger: MyLoggerService,
  ) {}

  /**
   * Crée une nouvelle boutique.
   * Accessible uniquement par les utilisateurs ayant la permission canCreateStore a true.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard) // L'utilisateur doit être authentifié globalement
  async createStore(
    @Body() createStoreDto: CreateStoreDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(`Creating store with DTO: ${JSON.stringify(createStoreDto)}`);

    console.log('accessToken expiration:', this.configService.jwtAccesTokenExpirationMs);

    const { store, accessToken, refreshToken } =
      await this.storeService.createStore(createStoreDto);

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
    console.log('BODY:', createStoreDto);

    return { message: 'Store created successfully and session opened.', store };
  }

  // /**
  //  * Récupère toutes les boutiques.
  //  * Accessible uniquement par les Super-Admins.
  //  */
  // @Get()
  // @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard)
  // async findAllStores(@Req() req: JwtAuthRequest) {
  //   if (!req.user.canCreateStore) {
  //     throw new ForbiddenException("Vous n'êtes pas autorisé à lister toutes les boutiques.");
  //   }
  //   return this.storeService.findAllStores();
  // }

  // /**
  //  * Récupère une boutique par son ID.
  //  * Accessible par le Super-Admin, le propriétaire de la boutique, ou un StoreUser de cette boutique.
  //  */
  // @Get(':id')
  // @HttpCode(HttpStatus.OK)
  // // Utilise StoreJwtGuard pour s'assurer que l'utilisateur est dans le contexte d'une boutique
  // // ou JwtAuthGuard si l'utilisateur est un Super-Admin sans contexte de boutique.
  // // La logique d'autorisation est gérée dans le service.
  // @UseGuards(JwtAuthGuard) // Utilise JwtAuthGuard pour obtenir l'ID utilisateur global
  // findStoreById(@Param('id', ParseIntPipe) id: number, @Req() req: JwtAuthRequest) {
  //   // Si l'utilisateur a un store_user_id dans son token (il est dans le contexte d'une boutique)
  //   const storeUserId = (req as StoreJwtAuthRequest).user?.storeUserId;
  //   return this.storeService.findStoreById(id, req.user.sub, storeUserId);
  // }

  // /**
  //  * Met à jour les informations d'une boutique.
  //  * Accessible par le Super-Admin, le propriétaire de la boutique, ou un StoreUser avec permission 'manage_store_settings'.
  //  */
  // @Patch(':id')
  // @HttpCode(HttpStatus.OK)
  // // Utilise StoreJwtGuard pour s'assurer que l'utilisateur est dans le contexte d'une boutique
  // // et RolesGuard/PermissionsGuard pour vérifier les permissions.
  // // JwtAuthGuard est un fallback pour les Super-Admins.
  // @UseGuards(StoreJwtGuard) // Assure que nous avons le contexte de la boutique et les permissions
  // @PermissionKeys('manage_store_settings') // Nécessite la permission 'manage_store_settings'
  // async updateStore(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() updateStoreDto: UpdateStoreDto,
  //   @Req() req: StoreJwtAuthRequest, // req.user est StoreUserJwtPayload ici
  // ) {
  //   const userId = req.user.sub;
  //   const storeUserId = req.user.store_user_id;
  //   const permissions = req.user.permissions; // Récupère les permissions du token

  //   // Le service gérera la logique d'autorisation complexe (SuperAdmin, Owner, StoreUser avec permission)
  //   return this.storeService.updateStore(id, updateStoreDto, userId, storeUserId, permissions);
  // }

  // /**
  //  * Supprime une boutique.
  //  * Accessible uniquement par les Super-Admins.
  //  */
  // @Delete(':id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @UseGuards(JwtAuthGuard) // Seul le JwtAuthGuard est nécessaire pour les Super-Admins
  // async deleteStore(@Param('id', ParseIntPipe) id: number, @Req() req: JwtAuthRequest) {
  //   if (!req.user.canCreateStore) {
  //     throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer une boutique.");
  //   }
  //   await this.storeService.deleteStore(id, req.user.sub);
  //   return; // Retourne un 204 No Content
  // }
}
