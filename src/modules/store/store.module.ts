import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StoreUser } from 'src/entities/store-user.entity';
import { Permission } from 'src/entities/permission.entity';
import { Store } from 'src/entities/store.entity';
import { Role } from 'src/entities/role.entity';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';
import { StoreSetting } from 'src/entities/store-setting.entity';
import { PaymentMethod } from 'src/entities/payment-method.entity';
import { User } from 'src/entities/User.entity';
import { CashRegister } from 'src/entities/cash-register.entity';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { AppConfigModule } from 'src/config/config.module';

@Module({
  imports: [
    AuthModule,
    AppConfigModule,
    RequestContextModule,
    MyLoggerModule,
    TypeOrmModule.forFeature([
      StoreUser,
      Permission,
      Store,
      Role,
      StoreSetting,
      PaymentMethod,
      CashRegister,
      User,
    ]),
  ],
  providers: [StoreService],
  controllers: [StoreController],
  exports: [StoreService],
})
export class StoreModule {}
