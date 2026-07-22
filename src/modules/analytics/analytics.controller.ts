import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionKeys } from '../auth/decorators/permissions.decorator';
import { PermissionKey } from '../store/constants/permission-enum';

@UseGuards(StoreJwtGuard, PermissionsGuard)
@PermissionKeys(PermissionKey.ACCESS_STORE_DASHBOARD)
@Controller('store/:storeId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('sales-overview')
  getSalesOverview(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.analyticsService.getSalesOverview(storeId);
  }

  @Get('product-performance')
  getProductPerformance(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.analyticsService.getProductPerformance(storeId);
  }

  @Get('sales-trend')
  getSalesTrend(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.analyticsService.getSalesTrend(storeId);
  }

  @Get('top-products')
  getTopProducts(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.analyticsService.getTopProducts(storeId);
  }

  @Get('summary/revenue')
  getRevenueSummary(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.analyticsService.getRevenueSummary(storeId);
  }

  @Get('summary/sales')
  getSalesSummary(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.analyticsService.getSalesSummary(storeId);
  }

  @Get('summary/profit')
  getProfitSummary(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.analyticsService.getProfitSummary(storeId);
  }
}
