import { Module } from '@nestjs/common';
import { CashMovementService } from './cash-movement.service';
import { CashMovementController } from './cash-movement.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { CashMovement } from 'src/entities/cash-movement.entity';
import { CashRegisterSession } from 'src/entities/cash-register-session.entity';

import { StoreUser } from 'src/entities/store-user.entity';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CashMovement, CashRegisterSession, StoreUser]),
    MyLoggerModule,
    AuthModule,
    RequestContextModule,
  ],
  providers: [CashMovementService],
  controllers: [CashMovementController],
  exports: [CashMovementService],
})
export class CashMovementModule {}
