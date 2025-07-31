import {
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionKeys } from '../auth/decorators/permissions.decorator';
import { PermissionKey } from '../store/constants/permission-enum';
import { Response } from 'express';

@UseGuards(StoreJwtGuard, PermissionsGuard)
@PermissionKeys(PermissionKey.VIEW_STOCK_REPORTS, PermissionKey.VIEW_FINANCIAL_REPORTS)
@Controller('store/:storeId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  getSalesReport(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.reportsService.getSalesReport(storeId);
  }

  @Get('inventory/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="inventory-summary.csv"')
  async getInventoryReportCSV(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Res() res: Response,
  ) {
    const report = await this.reportsService.getInventoryReport(storeId);
    const csvRows = [
      Object.keys(report).join(','), // header
      Object.values(report)
        .map((v) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : v))
        .join(','), // values
    ];
    const csvString = csvRows.join('\n');

    res.send(csvString);
  }

  @Get('inventory/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="executive-summary.pdf"')
  async getInventoryReportPDF(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Res() res: Response,
  ) {
    const inventorySummary = await this.reportsService.getInventoryReport(storeId);

    // Generate PDF buffer from summary object (assuming you have a helper for this)
    const pdfBuffer = await this.reportsService.generateExecutiveSummaryPDFBuffer(inventorySummary);

    res.end(pdfBuffer);
  }

  @Get('summary/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="executive-summary.csv"')
  async downloadSummaryCSV(
    @Query('from') from: string,
    @Query('to') to: string,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Res() res: Response,
  ) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const summary = await this.reportsService.generateExecutiveSummary(fromDate, toDate, storeId);

    // Convert summary object to CSV string
    const csvRows = [
      Object.keys(summary).join(','), // header
      Object.values(summary).join(','), // values
    ];
    const csvString = csvRows.join('\n');

    res.send(csvString);
  }

  @Get('summary/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="executive-summary.pdf"')
  async downloadSummaryPDF(
    @Query('from') from: string,
    @Query('to') to: string,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Res() res: Response,
  ) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const summary = await this.reportsService.generateExecutiveSummary(fromDate, toDate, storeId);

    // Generate PDF buffer from summary object (assuming you have a helper for this)
    const pdfBuffer = await this.reportsService.generateExecutiveSummaryPDFBuffer(summary);

    res.end(pdfBuffer);
  }
}
