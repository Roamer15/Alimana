import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from 'src/entities/permission.entity';
// import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission]), // ✅ This registers PermissionRepository
    AuthModule,
    RequestContextModule,
    MyLoggerModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}
