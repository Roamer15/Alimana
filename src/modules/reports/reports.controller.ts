import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
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

  @Get('inventory')
  getInventoryReport(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.reportsService.getInventoryReport(storeId);
  }

  @Get('summary/csv')
  async downloadSummaryCSV(
    @Query('from') from: string,
    @Query('to') to: string,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Res() res: Response,
  ) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const csv = await this.reportsService.generateExecutiveSummary(fromDate, toDate, storeId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="executive-summary.csv"');
    res.send(csv);
  }

  @Get('summary/pdf')
  async downloadSummaryPDF(
    @Query('from') from: string,
    @Query('to') to: string,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Res() res: Response,
  ) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const pdfBuffer = await this.reportsService.generateExecutiveSummary(fromDate, toDate, storeId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="executive-summary.csv"');
    res.send(pdfBuffer);
  }
}
