import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from 'src/entities/sale.entity';
import { Payment } from 'src/entities/payment.entity';
import { PaymentMethod } from 'src/entities/payment-method.entity';

interface PaymentMethodUsage {
  paymentMethodId: string | number;
  paymentMethodName: string | number;
  totalAmount: string | number;
  transactionCount: string | number;
}

export interface PaymentAnalyticsResponse {
  paymentMethodUsage: PaymentMethodUsage[];
  totalSalesAmount: number;
  totalTransactions: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

interface Result {
  totalAmount?: string | number; // Make it explicit what properties you expect
  // Add other expected properties here
}

export interface PaymentMethodTrend {
  period: string;
  paymentMethodName: string;
  totalAmount: string;
  transactionCount: string;
}

@Injectable()
export class PaymentAnalyticsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async getPaymentMethodUsage(
    storeId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PaymentAnalyticsResponse> {
    // Set default date range if not provided (last 30 days)
    const defaultEndDate = endDate || new Date();
    const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Query to get payment method usage with aggregated data
    const paymentUsageQuery = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.sale', 'sale')
      .leftJoin('payment.paymentMethod', 'paymentMethod')
      .select([
        'paymentMethod.id as "paymentMethodId"',
        'paymentMethod.name as "paymentMethodName"',
        'SUM(payment.amount) as "totalAmount"',
        'COUNT(payment.id) as "transactionCount"',
      ])
      .where('sale.storeId = :storeId', { storeId })
      .andWhere('sale.status = :status', { status: 'completed' })
      .andWhere('sale.createdAt >= :startDate', { startDate: defaultStartDate })
      .andWhere('sale.createdAt <= :endDate', { endDate: defaultEndDate })
      .groupBy('paymentMethod.id, paymentMethod.name');

    const rawResults = await paymentUsageQuery.getRawMany<PaymentMethodUsage>();

    // Calculate total amounts for percentage calculation
    const totalSalesAmount = rawResults.reduce((sum: number, result: Result) => {
      const amount = parseFloat(String(result.totalAmount ?? '0'));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const totalTransactions = rawResults.reduce(
      (sum, result) => sum + parseInt(String(result.transactionCount ?? '0')),
      0,
    );

    // Transform raw results to PaymentMethodUsage objects
    const paymentMethodUsage: PaymentMethodUsage[] = rawResults.map((result) => ({
      paymentMethodId: parseInt(String(result?.paymentMethodId)),
      paymentMethodName: result?.paymentMethodName,
      totalAmount: parseFloat(String(result?.totalAmount || 0)),
      transactionCount: parseInt(String(result?.transactionCount || 0)),
      percentage:
        totalSalesAmount > 0
          ? (parseFloat(String(result?.totalAmount || 0)) / totalSalesAmount) * 100
          : 0,
    }));

    return {
      paymentMethodUsage,
      totalSalesAmount,
      totalTransactions,
      dateRange: {
        startDate: defaultStartDate,
        endDate: defaultEndDate,
      },
    };
  }

  async getPaymentMethodTrends(
    storeId: number,
    startDate?: Date,
    endDate?: Date,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    const defaultEndDate = endDate || new Date();
    const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-%u'; // Year-Week
        break;
      case 'month':
        dateFormat = '%Y-%m'; // Year-Month
        break;
      default:
        dateFormat = '%Y-%m-%d'; // Year-Month-Day
    }

    const trendsQuery = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.sale', 'sale')
      .leftJoin('payment.paymentMethod', 'paymentMethod')
      .select([
        `DATE_FORMAT(sale.createdAt, '${dateFormat}') as period`,
        'paymentMethod.name as "paymentMethodName"',
        'SUM(payment.amount) as "totalAmount"',
        'COUNT(payment.id) as "transactionCount"',
      ])
      .where('sale.storeId = :storeId', { storeId })
      .andWhere('sale.status = :status', { status: 'completed' })
      .andWhere('sale.createdAt >= :startDate', { startDate: defaultStartDate })
      .andWhere('sale.createdAt <= :endDate', { endDate: defaultEndDate })
      .groupBy('period, paymentMethod.id, paymentMethod.name')
      .orderBy('period', 'ASC')
      .addOrderBy('totalAmount', 'DESC');

    return await trendsQuery.getRawMany<PaymentMethodTrend>();
  }
}
