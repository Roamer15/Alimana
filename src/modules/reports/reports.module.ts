import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/entities/product.entity';
import { SaleItem } from 'src/entities/sale-item.entity';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { GeminiService } from 'src/ai/gemini.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, SaleItem]), MyLoggerModule, RequestContextModule],
  controllers: [ReportsController],
  providers: [ReportsService, GeminiService],
})
export class ReportsModule {}
