import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { Category } from 'src/entities/category.entity';
import { Store } from 'src/entities/store.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { Not, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
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

  async createCategory(storeId: number, dto: CreateCategoryDto): Promise<Category> {
    this.validateStoreAccess(storeId);

    return this.categoryRepo.manager.transaction(async (manager) => {
      try {
        // 1. Verify store exists
        const store = await manager.findOne(Store, {
          where: { id: storeId },
        });
        if (!store) {
          throwHttpError(ErrorCode.STORE_NOT_FOUND, { storeId });
        }

        // 2. Check for duplicate category name
        const exists = await manager.findOne(Category, {
          where: {
            name: dto.name,
            storeId,
          },
        });
        if (exists) {
          throwHttpError(ErrorCode.CATEGORY_ALREADY_EXISTS, {
            storeId,
            name: dto.name,
          });
        }

        // 3. Create and save category
        const category = manager.create(Category, {
          ...dto,
          store: store, // Better to assign the entity than just storeId
        });

        const savedCategory = await manager.save(category);

        this.logger.log(`Category created: ${savedCategory.name} (ID: ${savedCategory.id})`);
        return savedCategory;
      } catch (error) {
        this.logger.error(
          `Transaction failed for category creation in store ${storeId}`,
          error instanceof Error ? error.stack : String(error),
        );

        // Re-throw after logging (transaction will auto-rollback)
        throwHttpError(ErrorCode.CATEGORY_CREATION_FAILED, {
          storeId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
  async updateCategory(
    storeId: number,
    categoryId: number,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    this.validateStoreAccess(storeId);

    return this.categoryRepo.manager.transaction(async (manager) => {
      try {
        // 1. Verify category exists and belongs to store
        const category = await manager.findOne(Category, {
          where: { id: categoryId, storeId },
          relations: ['store'], // Load store relation if needed
        });

        if (!category) {
          throwHttpError(ErrorCode.CATEGORY_NOT_FOUND, {
            categoryId,
            storeId,
          });
        }

        // 2. Check for name conflicts if name is being changed
        if (dto.name && dto.name !== category.name) {
          const duplicate = await manager.findOne(Category, {
            where: {
              storeId,
              name: dto.name,
              id: Not(categoryId),
            },
          });

          if (duplicate) {
            throwHttpError(ErrorCode.CATEGORY_ALREADY_EXISTS, {
              storeId,
              name: dto.name,
            });
          }
        }

        // 3. Apply updatesconst updatedCategory = { ...category, ...dto } as Category;
        const updatedCategory = { ...category, ...dto } as Category;

        // 4. Save changes
        const result = await manager.save(updatedCategory);

        this.logger.log(
          `Category updated - ID: ${categoryId}, Store: ${storeId}`,
          JSON.stringify({
            changes: dto,
          }),
        );

        return result;
      } catch (error) {
        this.logger.error(
          `Transaction failed for category update - ID: ${categoryId}`,
          error instanceof Error ? error.stack : String(error),
          JSON.stringify({ storeId, categoryId }),
        );

        throwHttpError(ErrorCode.CATEGORY_UPDATE_FAILED, {
          categoryId,
          storeId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  async getAllCategories(storeId: number): Promise<Category[]> {
    return await this.categoryRepo.find({ where: { storeId }, order: { name: 'ASC' } });
  }

  async deleteCategory(storeId: number, categoryId: number): Promise<void> {
    this.validateStoreAccess(storeId);

    return this.categoryRepo.manager.transaction(async (manager) => {
      try {
        // 1. Verify category exists and belongs to store
        const category = await manager.findOne(Category, {
          where: { id: categoryId, storeId },
          relations: ['products'],
          lock: { mode: 'pessimistic_write' }, // Prevent concurrent modifications
        });

        if (!category) {
          throwHttpError(ErrorCode.CATEGORY_NOT_FOUND, {
            categoryId,
            storeId,
          });
        }

        // 2. Check for associated products
        if (category.products?.length > 0) {
          throwHttpError(ErrorCode.CATEGORY_HAS_PRODUCTS, {
            categoryId,
            productCount: category.products.length,
          });
        }

        // 3. Perform deletion
        await manager.delete(Category, categoryId);

        // 4. Log success (inside transaction)
        this.logger.log(
          `Category deleted - ID: ${categoryId}`,
          JSON.stringify({
            storeId,
            deletedAt: new Date().toISOString(),
          }),
        );
      } catch (error) {
        this.logger.error(
          `Transaction failed for category deletion - ID: ${categoryId}`,
          error instanceof Error ? error.stack : String(error),
          JSON.stringify({ storeId, categoryId }),
        );

        throwHttpError(ErrorCode.CATEGORY_DELETE_FAILED, {
          categoryId,
          storeId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
}
