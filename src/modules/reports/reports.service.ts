import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GeminiService } from 'src/ai/gemini.service';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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

  private splitText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
    // Splits text into lines that fit within maxWidth
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  async generateExecutiveSummary(from: Date, to: Date, storeId: number) {
    const sales = await this.saleItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.sale', 'sale')
      .leftJoin('item.product', 'product')
      .select('SUM(item.totalPrice)', 'totalRevenue')
      .addSelect('SUM(item.quantity)', 'totalUnits')
      .addSelect('SUM((item.unitPrice - product.costPrice) * item.quantity)', 'totalProfit')
      .where('sale.storeId = :storeId', { storeId }) // Filter by store from the sale table
      .andWhere('sale.createdAt BETWEEN :from AND :to', { from, to })
      .getRawOne<{
        totalRevenue: string;
        totalUnits: string;
        totalProfit: string;
      }>();
    const topProduct = await this.saleItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.sale', 'sale')
      .leftJoin('item.product', 'product')
      .select('product.name', 'productName')
      .addSelect('SUM(item.quantity)', 'totalUnits')
      .where('sale.storeId = :storeId', { storeId })
      .andWhere('sale.createdAt BETWEEN :from AND :to', { from, to })
      .groupBy('product.name')
      .orderBy('"totalUnits"', 'DESC')
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

    const aiInsights = await this.geminiService.generateSalesInsight(summaryText);

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

  /**
   * Generate a PDF buffer from the executive summary object.
   * @param summary The summary object containing report data.
   * @returns Buffer containing the generated PDF.
   */
  /**
   * Generate a PDF buffer from the executive summary object using pdf-lib.
   * @param summary The summary object containing report data.
   * @returns Buffer containing the generated PDF.
   */

  async generateExecutiveSummaryPDFBuffer(summary: Record<string, any>): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const pageWidth = 595.28;
    const pageHeight = 841.89; // A4
    const marginLeft = 50;
    const marginTop = 60;
    const marginBottom = 60;
    const maxWidth = pageWidth - marginLeft * 2;
    const lineHeight = 20;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = pageHeight - marginTop;

    // Title
    page.drawText('Executive Summary', {
      x: marginLeft,
      y,
      size: 24,
      font,
      color: rgb(0, 0, 0),
    });
    y -= 40;

    // Render summary fields (except insights)
    Object.entries(summary).forEach(([key, value]) => {
      if (key === 'insights') return;
      const label = `${key}: `;
      const text = typeof value === 'string' ? value : String(value);
      const line = `${label}${text}`;
      page.drawText(line, {
        x: marginLeft,
        y,
        size: 14,
        font,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight;
      if (y < marginBottom + lineHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - marginTop;
      }
    });

    // Render insights section with markdown-like formatting
    if (summary.insights) {
      y -= 10;
      const insightsText = typeof summary.insights === 'string' ? summary.insights : '';
      const sections = insightsText.split('\n');
      for (let section of sections) {
        section = section.trim();
        if (!section) {
          y -= lineHeight / 2;
          continue;
        }
        // Headings
        if (section.startsWith('###')) {
          page.drawText(section.replace(/^#+\s*/, ''), {
            x: marginLeft,
            y,
            size: 18,
            font,
            color: rgb(0.1, 0.1, 0.5),
          });
          y -= lineHeight + 4;
        }
        // Subheadings
        else if (section.startsWith('**')) {
          page.drawText(section.replace(/\*\*/g, ''), {
            x: marginLeft,
            y,
            size: 16,
            font,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= lineHeight;
        }
        // Bullet points
        else if (section.startsWith('*')) {
          const bullet = '• ' + section.replace(/^\*\s*/, '');
          const lines = this.splitText(bullet, font, 14, maxWidth - 20);
          for (const line of lines) {
            page.drawText(line, {
              x: marginLeft + 20,
              y,
              size: 14,
              font,
              color: rgb(0, 0, 0),
            });
            y -= lineHeight;
            if (y < marginBottom + lineHeight) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              y = pageHeight - marginTop;
            }
          }
        }
        // Numbered points
        else if (/^\d+\./.test(section)) {
          const lines = this.splitText(section, font, 14, maxWidth - 10);
          for (const line of lines) {
            page.drawText(line, {
              x: marginLeft + 10,
              y,
              size: 14,
              font,
              color: rgb(0, 0, 0),
            });
            y -= lineHeight;
            if (y < marginBottom + lineHeight) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              y = pageHeight - marginTop;
            }
          }
        }
        // Regular text
        else {
          const lines = this.splitText(section, font, 14, maxWidth);
          for (const line of lines) {
            page.drawText(line, {
              x: marginLeft,
              y,
              size: 14,
              font,
              color: rgb(0, 0, 0),
            });
            y -= lineHeight;
            if (y < marginBottom + lineHeight) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              y = pageHeight - marginTop;
            }
          }
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
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
    // 1. Fetch inventory data with proper typing
    const inventoryItems = await this.productRepo.find({
      where: { storeId },
      select: [
        'id',
        'name',
        'quantityInStock',
        'sellingPrice',
        'costPrice',
        'discountPercentage',
        'category',
        'createdAt',
      ],
      order: { quantityInStock: 'ASC' },
    });
    console.log(inventoryItems);
    // 2. Transform data for AI consumption
    const aiPayload = inventoryItems.map((item) => ({
      product_id: item.id,
      product_name: item.name,
      current_stock: item.quantityInStock,
      price: item.sellingPrice,
      cost: item.costPrice,
      profit_margin: (((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100).toFixed(2),
      discount: item.discountPercentage,
      category: item.category,
      days_since_restock: item.createdAt
        ? Math.floor(
            (new Date().getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24),
          )
        : null,
      stock_status: this.getStockStatus(item.quantityInStock),
    }));

    console.log(aiPayload);

    // 3. Add summary statistics
    const summary = {
      total_products: inventoryItems.length,
      out_of_stock: inventoryItems.filter((i) => i.quantityInStock <= 0).length,
      low_stock: inventoryItems.filter((i) => i.quantityInStock > 0 && i.quantityInStock < 10)
        .length,
      total_inventory_value: inventoryItems.reduce(
        (sum, item) => sum + item.quantityInStock * item.costPrice,
        0,
      ),
      potential_revenue: inventoryItems.reduce(
        (sum, item) => sum + item.quantityInStock * item.sellingPrice,
        0,
      ),
    };

    // 4. Structure the complete request
    const aiRequest = {
      inventory_data: aiPayload,
      summary_statistics: summary,
      analysis_instructions: `
      You are an inventory manger. Please analyze this inventory while getting slight insight from the summary_statistics and provide:
      1. Top 5 products needing restock
      2. Products with highest profit margins
      3. Discount effectiveness analysis
      4. Category performance insights
      5. Recommendations for inventory optimization
      If no data is provided answer accordingly witha beffiting response. Also consider warning the user on products that are soon out of stock if the number of the product is below 10
    `,
    };
    console.log(aiRequest);
    // 5. Get AI insights with error handling
    try {
      const textAiRequest = JSON.stringify(aiRequest);
      const aiInsights = await this.geminiService.generateInventoryInsight(textAiRequest);
      return {
        raw_data: inventoryItems,
        insights: aiInsights,
        summary,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      this.logger.error('Failed to generate AI insights', error.stack);
      throw new Error('Inventory analysis temporarily unavailable');
    }
  }

  private getStockStatus(quantity: number): string {
    if (quantity <= 0) return 'out_of_stock';
    if (quantity < 5) return 'critical';
    if (quantity < 10) return 'low';
    if (quantity < 20) return 'moderate';
    return 'healthy';
  }
}
