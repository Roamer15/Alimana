import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GeminiService } from 'src/ai/gemini.service';
import { Product } from 'src/entities/product.entity';
import { SaleItem } from 'src/entities/sale-item.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { Repository } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(
    private readonly logger: MyLoggerService,
    private geminiService: GeminiService,
    @InjectRepository(SaleItem) private readonly saleItemRepo: Repository<SaleItem>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  async generateExecutiveSummary(from: Date, to: Date, storeId: number) {
    const sales = await this.saleItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.sale', 'sale')
      .leftJoin('item.product', 'product')
      .select('SUM(item.totalPrice)', 'totalRevenue')
      .addSelect('SUM(item.quantity)', 'totalUnits')
      .addSelect('SUM((item.unitPrice - product.costPrice) * item.quantity)', 'totalProfit')
      .where('item.storeId = :storeId', { storeId })
      .andWhere('sale.createdAt BETWEEN :from AND :to', { from, to })
      .getRawOne<{ totalRevenue: string; totalUnits: string; totalProfit: string }>();

    const topProduct = await this.saleItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.sale', 'sale')
      .leftJoin('item.product', 'product')
      .select('product.name', 'productName')
      .addSelect('SUM(item.quantity)', 'totalUnits')
      .where('item.storeId = :storeId', { storeId })
      .andWhere('sale.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('product.name')
      .orderBy('totalUnits', 'DESC')
      .limit(1)
      .getRawOne<{ productName: string; totalUnits: string }>();

    const totalRevenue = parseFloat(sales?.totalRevenue || '0');
    const totalUnits = parseFloat(sales?.totalUnits || '0');
    const totalProfit = parseFloat(sales?.totalProfit || '0');
    const dayCount = Math.max(1, (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)); // prevent division by 0
    const averageRevenuePerDay = totalRevenue / dayCount;
    const averageProfitPerDay = totalProfit / dayCount;
    const summaryText = `
                Between ${from.toDateString()} and ${to.toDateString()}, the store sold ${totalUnits} products,
                generated ${totalRevenue.toFixed(2)} XAF in revenue, and earned approximately ${totalProfit.toFixed(2)} XAF in profit.

                The average daily revenue was ${averageRevenuePerDay.toFixed(2)} XAF and profit was ${averageProfitPerDay.toFixed(2)} XAF.  
                The best-selling product during this period was "${topProduct?.productName}" with ${topProduct?.totalUnits} units sold.

                Based on this performance, suggest insights and actionable improvements for the next period as well as present the information better if you wish.
`;

    const aiInsights = await this.geminiService.generateInsight(summaryText);

    return {
      from,
      to,
      revenue: totalRevenue,
      profit: totalProfit,
      units: totalUnits,
      avgRevenuePerDay: averageRevenuePerDay,
      avgProfitPerDay: averageProfitPerDay,
      topProduct: topProduct?.productName || 'N/A',
      topProductUnits: parseInt(topProduct?.totalUnits || '0', 10),
      insights: aiInsights,
    };
  }

  async getSalesReport(storeId: number, from?: Date, to?: Date) {
    const endDate = to ?? new Date();
    const startDate = from ?? new Date(new Date(endDate).setDate(endDate.getDate() - 7));

    return this.saleItemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoin('item.sale', 'sale')
      .where('item.storeId = :storeId', { storeId })
      .andWhere('sale.createdAt BETWEEN :from AND :to', { from: startDate, to: endDate })
      .select([
        'product.name AS productName',
        'SUM(item.quantity) AS totalUnitsSold',
        'SUM(item.totalPrice) AS totalRevenue',
        'SUM((item.unitPrice - product.costPrice) * item.quantity) AS profit',
      ])
      .groupBy('product.name')
      .orderBy('totalUnitsSold', 'DESC')
      .getRawMany();
  }

  async getInventoryReport(storeId: number) {
    return this.productRepo.find({
      where: { storeId },
      select: ['id', 'name', 'quantityInStock', 'sellingPrice', 'costPrice', 'discountPercentage'],
      order: { quantityInStock: 'ASC' },
    });
  }
}
