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
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionKey } from '../store/constants/permission-enum';
import { PermissionKeys } from '../auth/decorators/permissions.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('store/:storeId/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_CATEGORIES)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoryService.createCategory(storeId, dto);
  }

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_CATEGORIES)
  @Get()
  async listAllCategories(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.categoryService.getAllCategories(storeId);
  }

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_CATEGORIES)
  @Patch(':categoryId')
  async updateCategory(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategory(storeId, categoryId, dto);
  }

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_CATEGORIES)
  @Delete(':categoryId')
  async deleteCategory(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
  ) {
    return this.categoryService.deleteCategory(storeId, categoryId);
  }
}
