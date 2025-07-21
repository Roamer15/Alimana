import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/entities/product.entity';
import { Category } from 'src/entities/category.entity';
import { Store } from 'src/entities/store.entity';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, Store]),
    AuthModule,
    RequestContextModule,
    MyLoggerModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
