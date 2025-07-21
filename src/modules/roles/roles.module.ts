import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission]), RequestContextModule],
  controllers: [RolesController],
  providers: [RolesService, MyLoggerService],
})
export class RolesModule {}
