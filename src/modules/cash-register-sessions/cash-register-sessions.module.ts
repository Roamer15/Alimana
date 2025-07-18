import { Module } from '@nestjs/common';
import { CashRegisterSessionService } from './cash-register-sessions.service';
import { CashRegisterSessionsController } from './cash-register-sessions.controller';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashRegisterSession } from 'src/entities/cash-register-session.entity';
import { CashRegister } from 'src/entities/cash-register.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([CashRegisterSession, CashRegister])],
  controllers: [CashRegisterSessionsController],
  providers: [CashRegisterSessionService, RequestContextService, MyLoggerService],
})
export class CashRegisterSessionsModule {}
