import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AppConfigService } from '../../config/config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/entities/User.entity';
import { UserRefreshToken } from 'src/entities/user-refresh-token.entity';
import { StoreUser } from 'src/entities/store-user.entity';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { StoreJwtGuard } from './guards/store-jwt.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { StoreJwtStrategy } from './strategies/store-jwt.strategy';
import { AppConfigModule } from 'src/config/config.module';
import { Store } from 'src/entities/store.entity';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { Invitation } from 'src/entities/invitation.entity';
import { PaymentMethod } from 'src/entities/payment-method.entity';
import { Payment } from 'src/entities/payment.entity';
import { Sale } from 'src/entities/sale.entity';
import { Category } from 'src/entities/category.entity';
import { AuditLog } from 'src/entities/audit-logs.entity';
import { CashRegisterSession } from 'src/entities/cash-register-session.entity';
import { CustomerReturn } from 'src/entities/customer-return.entity';
import { Product } from 'src/entities/product.entity';
import { CashRegister } from 'src/entities/cash-register.entity';
import { CustomerReturnItem } from 'src/entities/customer-return-item.entity';
import { DamagedOrExpiredItem } from 'src/entities/damaged-or-expired-item.entity';
import { DamagedOrExpiredReport } from 'src/entities/damaged-or-expired-report.entity';
import { Expense } from 'src/entities/expenses.entity';
import { InventoryMovement } from 'src/entities/inventory-movement.entity';
import { InventoryMovementItem } from 'src/entities/inventory-movement-item.entity';
import { SaleItem } from 'src/entities/sale-item.entity';
import { Receipt } from 'src/entities/sale-receipt.entity';
import { SupplierOrderItems } from 'src/entities/supplier-order-item.entity';
import { Supplier } from 'src/entities/supplier.entity';
import { SupplierOrders } from 'src/entities/supplier-order.entity';
import { StoreSetting } from 'src/entities/store-setting.entity';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([
      User,
      UserRefreshToken,
      StoreUser,
      Store,
      Role,
      Permission,
      Invitation,
      PaymentMethod,
      Payment,
      Sale,
      Product,
      AuditLog,
      CashRegister,
      CashRegisterSession,
      Category,
      CustomerReturn,
      CustomerReturnItem,
      DamagedOrExpiredItem,
      DamagedOrExpiredReport,
      Expense,
      InventoryMovement,
      InventoryMovementItem,
      SaleItem,
      Receipt,
      SupplierOrderItems,
      Supplier,
      SupplierOrders,
      StoreSetting,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtSecret,
        signOptions: {
          expiresIn: config.jwtAccessTokenExpiration,
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    GoogleStrategy,
    JwtStrategy,
    JwtAuthGuard,
    StoreJwtStrategy,
    StoreJwtGuard,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
