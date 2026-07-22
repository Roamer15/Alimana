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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionKeys } from '../auth/decorators/permissions.decorator';
import { PermissionKey } from '../store/constants/permission-enum';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from 'src/entities/product.entity';
import { ListProductsDto } from './dto/list-products.dto';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Controller('store/:storeId/product')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_PRODUCTS)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addProduct(@Param('storeId', ParseIntPipe) storeId: number, @Body() dto: CreateProductDto) {
    return this.productsService.addNewProduct(storeId, dto);
  }

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_PRODUCTS)
  @Get()
  async listProducts(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() query: ListProductsDto,
  ) {
    return this.productsService.listProducts(storeId, {
      ...query,
      isActive: true,
    });
  }

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_PRODUCTS)
  @Get('search')
  async searchProducts(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query('keyword') keyword: string,
  ) {
    return this.productsService.searchProducts(storeId, keyword);
  }

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_PRODUCTS)
  @Patch(':productId')
  async updateProduct(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(storeId, productId, dto);
  }

  /**
   * Basculer le statut d'activité d'un produit.
   * @returns ApiResponse avec le produit mis à jour.
   */
  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_PRODUCTS)
  @Patch(':productId/toggle-active')
  async toggleActive(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<ApiResponse<Product>> {
    // Remplacez 1 par l'ID de la boutique de l'utilisateur authentifié

    const updatedProduct = await this.productsService.toggleProductActive(storeId, productId);

    return {
      success: true,

      data: updatedProduct,

      message: `Produit "${updatedProduct.name}" a été ${updatedProduct.isActive ? 'activé' : 'désactivé'}.`,
    };
  }

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_PRODUCTS)
  @Delete(':productId')
  async deleteProduct(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.productsService.deleteProduct(storeId, productId);
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @PermissionKeys(PermissionKey.MANAGE_PRODUCTS)
  findAllProducts(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.productsService.findAllProductsForStore(storeId);
  }
}
