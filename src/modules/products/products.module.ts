import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';

@Module({
  imports: [MyLoggerModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
