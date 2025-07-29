import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GeminiService } from 'src/ai/gemini.service';
import { SaleItem } from 'src/entities/sale-item.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { Repository } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(
    private readonly logger: MyLoggerService,
    private geminiService: GeminiService,
    @InjectRepository(SaleItem) private readonly saleItemRepo: Repository<SaleItem>,
  ) {}

  async generateExecutiveSummary(from: Date, to: Date, storeId: number) {
    const sales = await this.saleItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.sale', 'sale')
      .leftJoin('item.product', 'product')
      .select('SUM(item.totalPrice', 'totalRevenue')
      .addSelect('SUM(item.quantity)', 'totalUnits')
      .addSelect('SUM((item.unitPrice - product.costPrice) * item.quantity)', 'totalProfit')
      .where('item.storeId = :storeId', { storeId })
      .where('sale.cratedAt BETWEEN :from AND :to', { from, to })
      .getRawOne<{ totalRevenue: string; totalUnits: string; totalProfit: string }>();

    const totalRevenue = parseFloat(sales?.totalRevenue || '0');
    const totalUnits = parseFloat(sales?.totalUnits || '0');
    const totalProfit = parseFloat(sales?.totalProfit || '0');

    const summaryText = `
                Between ${from.toDateString()} and ${to.toDateString()}, your store sold ${totalUnits} products
                and generated ${totalRevenue.toFixed(2)} XAF in revenue and made an estimated profit of ${totalProfit.toFixed(2)} XAF.
                Suggest insigts and improvement actions for this period.`;

    const aiInsights = await this.geminiService.generateInsight(summaryText);

    return {
      revenue: totalRevenue,
      profit: totalProfit,
      units: totalUnits,
      insights: aiInsights,
    };
  }
}
