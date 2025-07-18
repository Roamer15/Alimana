import { Module } from '@nestjs/common';
import { StoreSettingService } from './store-setting.service';
import { StoreSettingController } from './store-setting.controller';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';
import { AuthModule } from '../auth/auth.module';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreSetting } from 'src/entities/store-setting.entity';

@Module({
  imports: [
    MyLoggerModule,
    AuthModule,
    RequestContextModule,
    TypeOrmModule.forFeature([StoreSetting]),
  ],
  providers: [StoreSettingService],
  controllers: [StoreSettingController],
  exports: [StoreSettingService],
})
export class StoreSettingModule {}
