import { Module } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { CashRegisterController } from './cash-register.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashRegister } from 'src/entities/cash-register.entity';
import { Store } from 'src/entities/store.entity';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CashRegister, Store]),
    AuthModule,
    MyLoggerModule,
    RequestContextModule,
  ],
  controllers: [CashRegisterController],
  providers: [CashRegisterService],
})
export class CashRegisterModule {}
