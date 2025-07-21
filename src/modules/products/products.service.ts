import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { Category } from 'src/entities/category.entity';
import { Product } from 'src/entities/product.entity';
import { Store } from 'src/entities/store.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { Repository, FindOptionsWhere, Not, ILike } from 'typeorm';
import * as crypto from 'node:crypto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private readonly ctx = ProductsService.name;

  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Store)
    private storeRepo: Repository<Store>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
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

  // COnfirm if target store exists
  private async assertStoreExists(storeId: number): Promise<Store> {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) {
      this.logger.warn(`Store ${storeId} not found`, this.ctx);
      throwHttpError(ErrorCode.STORE_NOT_FOUND, { storeId });
    }
    return store;
  }

  private async assertCategoryValidity(
    categoryId: number,
    storeId: number,
  ): Promise<Category | null | undefined> {
    if (!categoryId) return;

    const category = await this.categoryRepo.findOne({ where: { id: categoryId, storeId } });
    if (!category) {
      this.logger.warn(`Category ${categoryId} not found in store ${storeId}`, this.ctx);
      throwHttpError(ErrorCode.CATEGORY_NOT_FOUND, { categoryId, storeId });
    }
    return category;
  }

  /**
   * Pick the final barcode to use:
   * - If user provided and non-empty: ensure unique in store; return it
   * - If omitted/empty: generate a unique one and return it
   */
  private async resolveBarcode(
    input: string | undefined | null,
    storeId: number,
    ignoreProductId?: number,
  ): Promise<string> {
    const trimmed = input?.trim();
    if (trimmed) {
      await this.ensureBarcodeUnique(trimmed, storeId, ignoreProductId);
      return trimmed;
    }
    return this.generateUniqueBarcode(storeId);
  }

  /**
   * Ensure a *given* barcode is unique in the store.
   * Throw if duplicate.
   */
  private async ensureBarcodeUnique(
    barcode: string,
    storeId: number,
    ignoreProductId?: number,
  ): Promise<void> {
    const where: FindOptionsWhere<Product> = {
      storeId,
      barcode,
      ...(ignoreProductId ? { id: Not(ignoreProductId) } : {}),
    };

    const existing = await this.productRepo.findOne({ where });
    if (existing) {
      this.logger.warn(`Duplicate barcode ${barcode} in store ${storeId}`, this.ctx);
      throwHttpError(ErrorCode.PRODUCT_BARCODE_EXISTS, { storeId, barcode });
    }
  }

  /**
   * Generate a unique random EAN-13-like barcode guaranteed not to conflict within the store.
   * NOTE: This does not check against *global* barcode standards; it's internal-safe only.
   */
  private async generateUniqueBarcode(storeId: number): Promise<string> {
    // Hard cap attempts to avoid infinite loop
    for (let attempts = 0; attempts < 10; attempts++) {
      const candidate = this.generateRandomEan13();
      const exists = await this.productRepo.findOne({
        where: { storeId, barcode: candidate },
      });
      if (!exists) {
        this.logger.log(`Generated new barcode ${candidate} for store ${storeId}`, this.ctx);
        return candidate;
      }
    }
    // Extremely unlikely unless store has millions of products
    this.logger.error(`Failed to generate unique barcode after 10 attempts`, undefined, this.ctx);
    throwHttpError(ErrorCode.PRODUCT_BARCODE_EXISTS, {
      storeId,
      reason: 'Auto-generated barcode collision. Try again.',
    });
  }

  /** Generate a random 12-digit base + compute EAN-13 checksum. */
  private generateRandomEan13(): string {
    // generate 12 random digits (string)
    // Use crypto to avoid bias; 0-9 digits
    let base12 = '';
    while (base12.length < 12) {
      const n = crypto.randomInt(0, 10); // 0..9
      base12 += n.toString();
    }
    const check = this.computeEan13CheckDigit(base12);
    return base12 + check;
  }

  /** Compute EAN-13 check digit from first 12 digits */
  private computeEan13CheckDigit(base12: string): string {
    // positions are counted from left, starting at index 0
    // sum odd positions *1, even positions *3 (where "odd" means 1-based index)
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = Number(base12[i]);
      // i is 0-based; convert to 1-based for rule
      const pos = i + 1;
      if (pos % 2 === 0) {
        // even position (1-based) => *3
        sum += digit * 3;
      } else {
        // odd position => *1
        sum += digit;
      }
    }
    const mod = sum % 10;
    const checkDigit = mod === 0 ? 0 : 10 - mod;
    return String(checkDigit);
  }

  async addNewProduct(storeId: number, dto: CreateProductDto): Promise<Product> {
    // Guard by context (only current store allowed)
    this.validateStoreAccess(storeId);

    return this.productRepo.manager.transaction(async (manager) => {
      try {
        this.logger.log(`Adding new product to store ID: ${storeId}`, this.ctx);

        // 1. Confirm store exists (use manager so we stay in the txn)
        await this.assertStoreExists(storeId);

        // 2. Validate category (if provided)
        await this.assertCategoryValidity(dto.categoryId, storeId);

        // 3. Resolve or generate barcode
        const finalBarcode = await this.resolveBarcode(dto.barcode, storeId);

        // 4. Build entity payload (avoid assigning null to non-nullable relation type)
        const productData: Partial<Product> = {
          ...dto,
          barcode: finalBarcode,
          categoryId: dto.categoryId,
          createdById: this.requestContextService.getContext().storeUserId ?? undefined,
          storeId,
          // category relation handled next
        };

        // 5. Create + Save
        const product = manager.getRepository(Product).create(productData);
        this.logger.log(`Product created in store ${storeId}`, this.ctx);

        return await manager.getRepository(Product).save(product);
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(
            `Error creating product in store ${storeId}`,
            error.stack || error.message,
            this.ctx,
          );
          throwHttpError(ErrorCode.PRODUCT_CREATION_FAILED, { storeId, error: error.message });
        }
        throwHttpError(ErrorCode.PRODUCT_CREATION_FAILED, { storeId, error: String(error) });
      }
    });
  }

  /** Update product */
  async updateProduct(storeId: number, productId: number, dto: UpdateProductDto): Promise<Product> {
    this.validateStoreAccess(storeId);
    return this.productRepo.manager.transaction(async (manager) => {
      try {
        this.logger.log(`Updating product ID: ${productId} in store ${storeId}`, this.ctx);
        const product = await manager
          .getRepository(Product)
          .findOne({ where: { id: productId, storeId } });
        if (!product) throwHttpError(ErrorCode.PRODUCT_NOT_FOUND, { productId, storeId });

        if (dto.categoryId !== undefined) {
          await this.assertCategoryValidity(dto.categoryId, storeId);
        }

        const finalBarcode = await this.resolveBarcode(
          dto.barcode ?? product.barcode,
          storeId,
          productId,
        );

        const updated = { ...product, ...dto, barcode: finalBarcode };
        return await manager.getRepository(Product).save(updated);
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(`Error updating product ${productId}`, error.stack, this.ctx);

          throwHttpError(ErrorCode.PRODUCT_UPDATE_FAILED, { error: error.message });
        }
        throwHttpError(ErrorCode.PRODUCT_UPDATE_FAILED, { error: String(error) });
      }
    });
  }

  /** Delete product */
  async deleteProduct(storeId: number, productId: number): Promise<void> {
    this.validateStoreAccess(storeId);
    try {
      const result = await this.productRepo.delete({ id: productId, storeId });
      if (result.affected === 0)
        throwHttpError(ErrorCode.PRODUCT_NOT_FOUND, { productId, storeId });
      this.logger.log(`Deleted product ${productId} from store ${storeId}`, this.ctx);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error deleting product ${productId}`, error.stack, this.ctx);
        throwHttpError(ErrorCode.PRODUCT_DELETE_FAILED, { error: error.message });
      }
      throwHttpError(ErrorCode.PRODUCT_DELETE_FAILED, { error: String(error) });
    }
  }

  /** List Products with Pagination & Category Filter */
  async listProducts(
    storeId: number,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      categoryId?: number;
      isActive?: boolean;
    },
  ) {
    this.validateStoreAccess(storeId);

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Product> = { storeId };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }

    const [items, total] = await this.productRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['category'],
    });

    return { page, limit, total, items };
  }

  /** Search Products */
  async searchProducts(storeId: number, keyword: string): Promise<Product[]> {
    this.validateStoreAccess(storeId);
    return this.productRepo.find({
      where: [
        { storeId, name: ILike(`%${keyword}%`) },
        { storeId, brand: ILike(`%${keyword}%`) },
        { storeId, barcode: ILike(`%${keyword}%`) },
      ],
      take: 20,
      relations: ['category'],
    });
  }
}
