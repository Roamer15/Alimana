import { Module } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { CashRegisterController } from './cash-register.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashRegister } from 'src/entities/cash-register.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { Store } from 'src/entities/store.entity';
import { CashRegisterSession } from 'src/entities/cash-register-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CashRegister, Store, CashRegisterSession])],
  controllers: [CashRegisterController],
  providers: [CashRegisterService, MyLoggerService, RequestContextService],
})
export class CashRegisterModule {}
