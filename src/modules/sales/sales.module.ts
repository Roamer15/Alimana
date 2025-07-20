import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { CashRegisterSession } from 'src/entities/cash-register-session.entity';
import { InventoryMovement } from 'src/entities/inventory-movement.entity';
import { PaymentMethod } from 'src/entities/payment-method.entity';
import { Product } from 'src/entities/product.entity';
import { SaleItem } from 'src/entities/sale-item.entity';
import { Receipt } from 'src/entities/sale-receipt.entity';
import { Sale } from 'src/entities/sale.entity';
import { StoreUser } from 'src/entities/store-user.entity';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';
import { Payment } from 'src/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      SaleItem,
      Payment,
      Product,
      PaymentMethod,
      InventoryMovement,
      Receipt,
      CashRegisterSession,
      StoreUser,
    ]),
    MyLoggerModule,
    RequestContextModule,
  ],
  providers: [SalesService],
  controllers: [SalesController],
  exports: [SalesService],
})
export class SalesModule {}
