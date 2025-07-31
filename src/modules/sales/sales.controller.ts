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
  Get,
  ForbiddenException,
} from '@nestjs/common';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { PermissionKeys } from '../auth/decorators/permissions.decorator';
import { StoreUserJwtPayload } from '../auth/auth.controller';
import { SalesService } from './sales.service';
import { PermissionKey } from '../store/constants/permission-enum';
import { CreateSaleDto } from './dto/sale-dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

interface StoreJwtAuthRequest extends Request {
  user: StoreUserJwtPayload;
}

@Controller('store/:storeId/sales')
@UseGuards(StoreJwtGuard, PermissionsGuard) // Toutes les routes ici nécessitent un contexte de boutique
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @PermissionKeys(PermissionKey.CREATE_SALE)
  async createSale(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() createSaleDto: CreateSaleDto,
  ) {
    return this.salesService.createSale(createSaleDto, storeId);
  }

  /**
   * Récupère une vente par son ID.
   */
  @Get(':saleId')
  @HttpCode(HttpStatus.OK)
  @PermissionKeys(PermissionKey.VIEW_SALES)
  async findSaleById(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('saleId', ParseIntPipe) saleId: number,
    @Req() req: StoreJwtAuthRequest,
  ) {
    if (req.user.storeId !== storeId) {
      throw new ForbiddenException(
        'Accès refusé. Vous ne pouvez voir les ventes que de votre boutique actuelle.',
      );
    }
    return this.salesService.findOne(saleId);
  }

  /**
   * Récupère toutes les ventes pour une boutique.
   * Nécessite la permission 'view_sales'.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @PermissionKeys(PermissionKey.VIEW_SALES)
  async findAllSales(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Req() req: StoreJwtAuthRequest,
  ) {
    if (req.user.storeId !== storeId) {
      throw new ForbiddenException(
        'Accès refusé. Vous ne pouvez voir les ventes que de votre boutique actuelle.',
      );
    }
    return this.salesService.findAllForStore(storeId);
  }
}
