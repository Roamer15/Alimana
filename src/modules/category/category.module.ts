import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';

@Module({
  imports: [MyLoggerModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
