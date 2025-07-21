import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/entities/category.entity';
import { Store } from 'src/entities/store.entity';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Store]),
    AuthModule,
    RequestContextModule,
    MyLoggerModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
