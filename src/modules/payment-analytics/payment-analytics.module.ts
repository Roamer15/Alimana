import { Module } from '@nestjs/common';
import { PaymentAnalyticsService } from './payment-analytics.service';
import { PaymentAnalyticsController } from './payment-analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from 'src/entities/payment.entity';
import { PaymentMethod } from 'src/entities/payment-method.entity';
import { Sale } from 'src/entities/sale.entity';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentMethod, Sale]),
    RequestContextModule,
    MyLoggerModule,
  ],
  controllers: [PaymentAnalyticsController],
  providers: [PaymentAnalyticsService],
})
export class PaymentAnalyticsModule {}
