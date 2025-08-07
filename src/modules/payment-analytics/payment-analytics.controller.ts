import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PaymentAnalyticsService, PaymentAnalyticsResponse } from './payment-analytics.service';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('store/:storeId/analytics/payments')
@UseGuards(StoreJwtGuard, PermissionsGuard)
export class PaymentAnalyticsController {
  constructor(private readonly paymentAnalyticsService: PaymentAnalyticsService) {}

  @Get('usage')
  async getPaymentMethodUsage(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PaymentAnalyticsResponse> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.paymentAnalyticsService.getPaymentMethodUsage(storeId, start, end);
  }

  @Get('trends')
  async getPaymentMethodTrends(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.paymentAnalyticsService.getPaymentMethodTrends(storeId, start, end, groupBy);
  }
}
