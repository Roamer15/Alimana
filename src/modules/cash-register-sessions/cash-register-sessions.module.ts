import { Module } from '@nestjs/common';
import { CashRegisterSessionsService } from './cash-register-sessions.service';
import { CashRegisterSessionsController } from './cash-register-sessions.controller';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';
import { AuthModule } from '../auth/auth.module';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { CashRegister } from 'src/entities/cash-register.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashMovement } from 'src/entities/cash-movement.entity';
import { Permission } from 'src/entities/permission.entity';
import { Role } from 'src/entities/role.entity';
import { Sale } from 'src/entities/sale.entity';
import { StoreUser } from 'src/entities/store-user.entity';
import { CashRegisterSession } from 'src/entities/cash-register-session.entity';

@Module({
  imports: [
    MyLoggerModule,
    AuthModule,
    RequestContextModule,
    TypeOrmModule.forFeature([
      CashRegister,
      StoreUser,
      Sale,
      CashMovement,
      Role,
      Permission,
      CashRegisterSession,
    ]),
  ],
  providers: [CashRegisterSessionsService],
  controllers: [CashRegisterSessionsController],
  exports: [CashRegisterSessionsService],
})
export class CashRegisterSessionsModule {}
