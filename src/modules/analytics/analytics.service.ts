import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { Product } from 'src/entities/product.entity';
import { SaleItem } from 'src/entities/sale-item.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { Repository } from 'typeorm';

interface RevenueResult {
  revenue: string | null;
}

interface UnitResult {
  units: string | null;
}

interface ProfitResult {
  profit: string | null;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepo: Repository<SaleItem>,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {}

  private calculateChange(previous: number, current: number): number {
    if (previous === 0) return current === 0 ? 0 : 100;
    return +(((current - previous) / previous) * 100).toFixed(2);
  }

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

  async getSalesOverview(storeId: number) {
    this.validateStoreAccess(storeId);
    return this.saleItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .leftJoin('item.sale', 'sale')
      .select("DATE_TRUNC('day', sale.createdAt)", 'day')
      .addSelect('SUM(item.totalPrice)', 'revenue')
      .addSelect('SUM((item.unitPrice - product.costPrice) * item.quantity)', 'profit')
      .where('sale.storeId = :storeId', { storeId })
      .andWhere("sale.createdAt >= CURRENT_DATE - INTERVAL '30 days'")
      .groupBy('day')
      .orderBy('day')
      .getRawMany();
  }

  async getProductPerformance(storeId: number) {
    this.validateStoreAccess(storeId);
    return this.saleItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .leftJoin('item.sale', 'sale')
      .select('product.name', 'product')
      .addSelect('SUM(item.quantity)', 'units_sold')
      .where('sale.storeId = :storeId', { storeId })
      .groupBy('product.name')
      .orderBy('units_sold', 'DESC')
      .getRawMany();
  }

  async getSalesTrend(storeId: number) {
    this.validateStoreAccess(storeId);
    return this.saleItemRepo
      .createQueryBuilder('item')
      .select("DATE_TRUNC('day', item.saleDate)", 'day')
      .addSelect('SUM(item.quantity)', 'total_units_sold')
      .where('item.storeId = :storeId', { storeId })
      .andWhere("item.saleDate >= CURRENT_DATE - INTERVAL '30 days'")
      .groupBy('day')
      .orderBy('day')
      .getRawMany();
  }

  async getTopProducts(storeId: number) {
    this.validateStoreAccess(storeId);
    return this.saleItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .select('product.name', 'product')
      .addSelect('SUM(item.quantity)', 'units_sold')
      .where('item.storeId = :storeId', { storeId })
      .groupBy('product.name')
      .orderBy('units_sold', 'DESC')
      .limit(10)
      .getRawMany();
  }

  async getRevenueSummary(storeId: number): Promise<{
    revenue_today: number;
    revenue_yesterday: number;
    percentage_change: number;
  }> {
    this.validateStoreAccess(storeId);
    const [today, yesterday] = await Promise.all([
      this.saleItemRepo
        .createQueryBuilder('item')
        .leftJoin('item.sale', 'sale')
        .select('SUM(item.totalPrice)', 'revenue')
        .where('sale.storeId = :storeId', { storeId })
        .where('DATE(sale.createdAt) = CURRENT_DATE')
        .getRawOne<RevenueResult>(),
      this.saleItemRepo
        .createQueryBuilder('item')
        .leftJoin('item.sale', 'sale')
        .select('SUM(item.totalPrice)', 'revenue')
        .where('sale.storeId = :storeId', { storeId })
        .andWhere("DATE(sale.createdAt) = CURRENT_DATE - INTERVAL '1 day'")
        .getRawOne<RevenueResult>(),
    ]);

    const todayRevenue = today?.revenue ? parseFloat(today.revenue) : 0;
    const yesterdayRevenue = yesterday?.revenue ? parseFloat(yesterday.revenue) : 0;

    console.log(todayRevenue);
    return {
      revenue_today: todayRevenue,
      revenue_yesterday: yesterdayRevenue,
      percentage_change: this.calculateChange(yesterdayRevenue, todayRevenue),
    };
  }

  async getSalesSummary(storeId: number): Promise<{
    units_today: number;
    units_yesterday: number;
    percentage_change: number;
  }> {
    this.validateStoreAccess(storeId);
    const [today, yesterday] = await Promise.all([
      this.saleItemRepo
        .createQueryBuilder('item')
        .leftJoin('item.sale', 'sale')
        .select('SUM(item.quantity)', 'units')
        .where('sale.storeId = :storeId', { storeId })
        .andWhere('DATE(sale.createdAt) = CURRENT_DATE')
        .getRawOne<UnitResult>(),
      this.saleItemRepo
        .createQueryBuilder('item')
        .leftJoin('item.sale', 'sale')
        .select('SUM(item.quantity)', 'units')
        .where('sale.storeId = :storeId', { storeId })
        .andWhere("DATE(sale.createdAt) = CURRENT_DATE - INTERVAL '1 day'")
        .getRawOne<UnitResult>(),
    ]);

    const todayUnits = today?.units ? parseFloat(today.units) : 0;
    const yesterdayUnits = yesterday?.units ? parseFloat(yesterday.units) : 0;
    return {
      units_today: todayUnits,
      units_yesterday: yesterdayUnits,
      percentage_change: this.calculateChange(yesterdayUnits, todayUnits),
    };
  }

  async getProfitSummary(storeId: number): Promise<{
    profit_today: number;
    profit_yesterday: number;
    percentage_change: number;
  }> {
    this.validateStoreAccess(storeId);
    const [today, yesterday] = await Promise.all([
      this.saleItemRepo
        .createQueryBuilder('item')
        .leftJoin('item.product', 'product')
        .leftJoin('item.sale', 'sale')
        .where('sale.storeId = :storeId', { storeId })
        .select('SUM((item.unitPrice - product.costPrice) * item.quantity)', 'profit')
        .andWhere('DATE(sale.createdAt) = CURRENT_DATE')
        .getRawOne<ProfitResult>(),
      this.saleItemRepo
        .createQueryBuilder('item')
        .leftJoin('item.product', 'product')
        .leftJoin('item.sale', 'sale')
        .select('SUM((item.unitPrice - product.costPrice) * item.quantity)', 'profit')
        .where('sale.storeId = :storeId', { storeId })
        .andWhere("DATE(sale.createdAt) = CURRENT_DATE - INTERVAL '1 day'")
        .getRawOne<ProfitResult>(),
    ]);

    const todayProfit = today?.profit ? parseFloat(today.profit) : 0;
    const yesterdayProfit = yesterday?.profit ? parseFloat(yesterday.profit) : 0;

    return {
      profit_today: todayProfit,
      profit_yesterday: yesterdayProfit,
      percentage_change: this.calculateChange(yesterdayProfit, todayProfit),
    };
  }
}
