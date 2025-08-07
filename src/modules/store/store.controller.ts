import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { StoreService, UpdateStoreDto } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';
import { AppConfigService } from 'src/config/config.service';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { PermissionKeys } from '../auth/decorators/permissions.decorator'; // Utilisé pour les permissions
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionKey } from './constants/permission-enum';
import { plainToInstance } from 'class-transformer';
import { StoreProfileDto } from './dto/store-profile.dto';
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

    return { message: 'Store created successfully and session opened.', store, accessToken };
  }

  /**
   * Récupère une boutique par son ID.
   * La logique d'autorisation est gérée dans le service.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(StoreJwtGuard)
  async findStoreById(@Param('id', ParseIntPipe) id: number) {
    return this.storeService.findStoreById(id);
  }

  /**
   * Met à jour les informations d'une boutique.
   * Accessible par le Admin, le propriétaire de la boutique, ou un StoreUser avec permission 'manage_store_settings'.
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_STORE_SETTINGS)
  async updateStore(@Param('id', ParseIntPipe) id: number, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storeService.updateStore(id, updateStoreDto);
  }

  /**
   * Supprime une boutique.
   * Accessible uniquement par les Admins.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deleteStore(@Param('id', ParseIntPipe) id: number) {
    await this.storeService.deleteStore(id);
    return { message: 'successfully Delete store' };
  }

  /**
   * GET /stores/:id
   * Endpoint pour récupérer le profil complet d'un magasin par son ID.
   * Nécessite une authentification JWT.
   *
   * @param storeId L'ID du magasin.
   * @returns Le profil complet du magasin avec ses utilisateurs et leurs rôles.
   */
  @Get('profile/:id')
  @UseGuards(JwtAuthGuard)
  @SerializeOptions({
    excludeExtraneousValues: true,
  })
  async getStoreProfile(@Param('id', ParseIntPipe) storeId: number): Promise<StoreProfileDto> {
    const storeWithRelations = await this.storeService.findOneWithRelations(storeId);

    // Transforme l'entité Store en DTO pour formater la réponse
    return plainToInstance(StoreProfileDto, storeWithRelations);
  }
}
