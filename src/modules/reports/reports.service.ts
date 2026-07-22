import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GeminiService } from 'src/ai/gemini.service';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Product } from 'src/entities/product.entity';
import { SaleItem } from 'src/entities/sale-item.entity';
import { Store } from 'src/entities/store.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { Repository } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(
    private readonly logger: MyLoggerService,
    private geminiService: GeminiService,
    @InjectRepository(SaleItem) private readonly saleItemRepo: Repository<SaleItem>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Store) private readonly storeRepo: Repository<Store>,
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

    const storeName = await this.storeRepo.findOne({
      where: { id: storeId },
      select: ['name'], // Only select the name field
    });

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
      storeName: storeName?.name,
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

    // Page setup
    const pageWidth = 595.28; // A4 width in points
    const pageHeight = 841.89; // A4 height in points
    const margin = 72; // 1 inch margins
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 20;
    const smallLineHeight = 16;

    // Colors
    const primaryColor = rgb(0.2, 0.4, 0.6); // Corporate blue
    const secondaryColor = rgb(0.3, 0.3, 0.3); // Dark gray
    const accentColor = rgb(0.8, 0.1, 0.1); // Red for highlights

    // Fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Add company logo (if available)
    try {
      if (summary.companyLogo) {
        const logoImage = await pdfDoc.embedPng(summary?.companyLogo);
        const logoDims = logoImage.scale(0.5);
        page.drawImage(logoImage, {
          x: margin,
          y: y - logoDims.height,
          width: logoDims.width,
          height: logoDims.height,
        });
        y -= logoDims.height + 30;
      }
    } catch (e) {
      console.warn('Could not embed logo:', e);
    }

    // Report title
    page.drawText('EXECUTIVE SUMMARY', {
      x: margin,
      y,
      size: 24,
      font: boldFont,
      color: primaryColor,
    });
    y -= 40;

    // Add date and page number
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    page.drawText(`Generated: ${dateStr}`, {
      x: margin,
      y: margin - 20,
      size: 10,
      font: italicFont,
      color: secondaryColor,
    });

    // Add horizontal rule
    page.drawLine({
      start: { x: margin, y: y + 10 },
      end: { x: pageWidth - margin, y: y + 10 },
      thickness: 1,
      color: primaryColor,
    });
    y -= 30;

    // Key metrics section
    page.drawText('KEY METRICS', {
      x: margin,
      y,
      size: 16,
      font: boldFont,
      color: primaryColor,
    });
    y -= 25;

    // Render summary fields in a two-column layout
    const column1X = margin;
    const column2X = pageWidth / 2;
    let currentColumn = 1;
    let columnY = y;

    Object.entries(summary).forEach(([key, value]) => {
      if (key === 'insights' || key === 'companyLogo') return;

      const label = `${this.capitalizeFirstLetter(key.replace(/([A-Z])/g, ' $1'))}: `;
      const text = typeof value === 'string' ? value : String(value);

      // Alternate between columns
      const xPos = currentColumn === 1 ? column1X : column2X;

      // Draw label in bold
      page.drawText(label, {
        x: xPos,
        y: columnY,
        size: 12,
        font: boldFont,
        color: secondaryColor,
      });

      // Measure text width to position value
      const labelWidth = boldFont.widthOfTextAtSize(label, 12);

      // Draw value
      page.drawText(text, {
        x: xPos + labelWidth + 5,
        y: columnY,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      });

      // Move to next line or column
      if (currentColumn === 1) {
        currentColumn = 2;
      } else {
        currentColumn = 1;
        columnY -= lineHeight;
      }

      // Check for page break
      if (columnY < margin + lineHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        columnY = pageHeight - margin;
        currentColumn = 1;
      }
    });

    y = columnY - (currentColumn === 1 ? 0 : lineHeight) - 30;

    // Insights section with professional formatting
    if (summary.insights) {
      page.drawText('ANALYSIS & INSIGHTS', {
        x: margin,
        y,
        size: 16,
        font: boldFont,
        color: primaryColor,
      });

      // Add horizontal rule
      page.drawLine({
        start: { x: margin, y: y - 10 },
        end: { x: pageWidth - margin, y: y - 10 },
        thickness: 0.5,
        color: secondaryColor,
      });

      y -= 30;

      const insightsText = typeof summary.insights === 'string' ? summary.insights : '';
      const sections = insightsText.split('\n');

      for (let section of sections) {
        section = section.trim();
        if (!section) {
          y -= lineHeight / 2;
          continue;
        }

        // Section headings
        if (section.startsWith('## ')) {
          page.drawText(section.replace('## ', ''), {
            x: margin,
            y,
            size: 14,
            font: boldFont,
            color: primaryColor,
          });
          y -= lineHeight + 5;
          continue;
        }

        // Subheadings
        if (section.startsWith('### ')) {
          page.drawText(section.replace('### ', ''), {
            x: margin + 10,
            y,
            size: 13,
            font: boldFont,
            color: secondaryColor,
          });
          y -= lineHeight;
          continue;
        }

        // Key points (bullet points)
        if (section.startsWith('* ')) {
          const bulletText = section.substring(2);
          const bulletWidth = boldFont.widthOfTextAtSize('• ', 12);

          page.drawText('• ', {
            x: margin + 20,
            y,
            size: 12,
            font: boldFont,
            color: accentColor,
          });

          const lines = this.splitText(bulletText, regularFont, 12, maxWidth - 40);
          for (const line of lines) {
            page.drawText(line, {
              x: margin + 20 + bulletWidth,
              y,
              size: 12,
              font: regularFont,
              color: rgb(0, 0, 0),
            });
            y -= smallLineHeight;

            if (y < margin + smallLineHeight) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              y = pageHeight - margin;
            }
          }
          continue;
        }

        // Numbered lists
        if (/^\d+\./.test(section)) {
          const match = section.match(/^(\d+\.)\s*(.*)/);
          if (match) {
            const [number, text] = match;
            const numberWidth = boldFont.widthOfTextAtSize(number, 12);

            page.drawText(number, {
              x: margin + 20,
              y,
              size: 12,
              font: boldFont,
              color: accentColor,
            });

            const lines = this.splitText(text, regularFont, 12, maxWidth - 40);
            for (const line of lines) {
              page.drawText(line, {
                x: margin + 20 + numberWidth + 5,
                y,
                size: 12,
                font: regularFont,
                color: rgb(0, 0, 0),
              });
              y -= smallLineHeight;

              if (y < margin + smallLineHeight) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                y = pageHeight - margin;
              }
            }
          }
          continue;
        }

        // Regular paragraphs
        const lines = this.splitText(section, regularFont, 12, maxWidth);
        for (const line of lines) {
          page.drawText(line, {
            x: margin,
            y,
            size: 12,
            font: regularFont,
            color: rgb(0, 0, 0),
          });
          y -= smallLineHeight;

          if (y < margin + smallLineHeight) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
        }

        // Add small space between paragraphs
        y -= smallLineHeight / 2;
      }
    }

    // Footer on each page
    const pages = pdfDoc.getPages();
    pages.forEach((pg, index) => {
      pg.drawText(`Page ${index + 1} of ${pages.length}`, {
        x: pageWidth - margin - 50,
        y: margin - 20,
        size: 10,
        font: italicFont,
        color: secondaryColor,
      });

      pg.drawText(`Confidential - ${summary.storeName || 'Company Name'}`, {
        x: margin,
        y: margin - 20,
        size: 10,
        font: italicFont,
        color: secondaryColor,
      });
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
