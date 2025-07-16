import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from 'src/entities/permission.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission]), // ✅ This registers PermissionRepository
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService, MyLoggerService],
})
export class PermissionsModule {}
