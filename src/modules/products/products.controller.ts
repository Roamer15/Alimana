import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionKeys } from '../auth/decorators/permissions.decorator';
import { PermissionKey } from '../store/constants/permission-enum';
import { UpdateProductDto } from './dto/update-product.dto';

@UseGuards(JwtAuthGuard)
@Controller('store/:storeId/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_PRODUCTS)
  @Post()
  async addProduct(@Param('storeId', ParseIntPipe) storeId: number, dto: CreateProductDto) {
    return this.productsService.addNewProduct(storeId, dto);
  }

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_PRODUCTS)
  @Get()
  async listProducts(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: number,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.productsService.listProducts(storeId, {
      page,
      limit,
      search,
      categoryId,
      isActive,
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
    dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(storeId, productId, dto);
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
}
