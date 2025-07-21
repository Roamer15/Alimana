import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { Category } from 'src/entities/category.entity';
import { Store } from 'src/entities/store.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { Not, Repository } from 'typeorm';
import { createCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    private readonly requestContextService: RequestContextService,
    private readonly logger: MyLoggerService,
  ) {}

  private validateStoreAccess(storeId: number): void {
    const { storeId: contextStoreId } = this.requestContextService.getContext();
    if (!contextStoreId) {
      throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);
    }

    if (contextStoreId !== storeId) {
      throwHttpError(ErrorCode.FORBIDDEN, {
        reason: 'Access denied. You can only view settings for your current store.',
      });
    }
  }

  async createCategory(storeId: number, dto: createCategoryDto): Promise<Category> {
    this.validateStoreAccess(storeId);
    try {
      const store = await this.storeRepo.findOne({ where: { id: storeId } });
      if (!store) throwHttpError(ErrorCode.STORE_NOT_FOUND, { storeId });

      const exists = await this.categoryRepo.findOne({ where: { name: dto.name } });
      if (exists) throwHttpError(ErrorCode.CATEGORY_ALREADY_EXISTS, { storeId, name: dto.name });

      const category = this.categoryRepo.create({ ...dto, storeId });

      this.logger.log(`Category created: ${category.name} (Store ${storeId})`);
      return await this.categoryRepo.save(category);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error creating category in store ${storeId}`,
          error.stack || error.message,
        );
        throwHttpError(ErrorCode.CATEGORY_CREATION_FAILED, { storeId, error: String(error) });
      }
      throwHttpError(ErrorCode.CATEGORY_CREATION_FAILED, { storeId, error: String(error) });
    }
  }

  async updateCategory(
    storeId: number,
    categoryId: number,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    this.validateStoreAccess(storeId);
    try {
      const category = await this.categoryRepo.findOne({ where: { id: categoryId, storeId } });
      if (!category) throwHttpError(ErrorCode.CATEGORY_NOT_FOUND, { categoryId });

      if (dto.name && dto.name !== category.name) {
        const duplicate = await this.categoryRepo.findOne({
          where: { storeId, name: dto.name, id: Not(categoryId) },
        });
        if (duplicate)
          throwHttpError(ErrorCode.CATEGORY_ALREADY_EXISTS, { storeId, name: dto.name });
      }

      Object.assign(category, dto);
      return await this.categoryRepo.save(category);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error updating category in store ${storeId}`,
          error.stack || error.message,
        );
        throwHttpError(ErrorCode.CATEGORY_UPDATE_FAILED, { storeId, error: String(error) });
      }
      throwHttpError(ErrorCode.CATEGORY_UPDATE_FAILED, { storeId, error: String(error) });
    }
  }

  async getAllCategories(storeId: number): Promise<Category[]> {
    return await this.categoryRepo.find({ where: { storeId }, order: { name: 'ASC' } });
  }

  async deleteCategory(storeId: number, categoryId: number): Promise<void> {
    this.validateStoreAccess(storeId);
    try {
      const category = await this.categoryRepo.findOne({
        where: { id: categoryId, storeId },
        relations: ['products'],
      });
      if (!category) throwHttpError(ErrorCode.CATEGORY_NOT_FOUND, { categoryId });

      if (category.products.length > 0) {
        throwHttpError(ErrorCode.CATEGORY_HAS_PRODUCTS, { categoryId });
      }

      await this.categoryRepo.delete(categoryId);
      this.logger.log(`Category ${categoryId} deleted`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error deleting category in store ${storeId}`,
          error.stack || error.message,
        );
        throwHttpError(ErrorCode.CATEGORY_DELETE_FAILED, { storeId, error: error.message });
      }
      throwHttpError(ErrorCode.CATEGORY_DELETE_FAILED, { storeId, error: String(error) });
    }
  }
}
