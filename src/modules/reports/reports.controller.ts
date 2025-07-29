import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionKeys } from '../auth/decorators/permissions.decorator';
import { PermissionKey } from '../store/constants/permission-enum';

@UseGuards(StoreJwtGuard, PermissionsGuard)
@PermissionKeys(PermissionKey.VIEW_STOCK_REPORTS, PermissionKey.VIEW_FINANCIAL_REPORTS)
@Controller('store/:storeId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  async aiStoreReport(
    @Query('from') from: string,
    @Query('to') to: string,
    @Param('storeId', ParseIntPipe) storeId: number,
  ) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return this.reportsService.generateExecutiveSummary(fromDate, toDate, storeId);
  }
}
