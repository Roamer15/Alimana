import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/entities/product.entity';
import { SaleItem } from 'src/entities/sale-item.entity';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, SaleItem]), RequestContextModule, MyLoggerModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
