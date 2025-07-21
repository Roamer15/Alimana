import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { AuthModule } from '../auth/auth.module';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission]),
    AuthModule,
    MyLoggerModule,
    RequestContextModule,
  ],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
