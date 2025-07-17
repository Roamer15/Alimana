import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from 'src/entities/permission.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission]), // ✅ This registers PermissionRepository
    RequestContextModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService, MyLoggerService],
})
export class PermissionsModule {}
