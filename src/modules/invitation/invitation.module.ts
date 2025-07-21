import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from 'src/config/config.module';
import { Invitation } from 'src/entities/invitation.entity';
import { Role } from 'src/entities/role.entity';
import { StoreUser } from 'src/entities/store-user.entity';
import { Store } from 'src/entities/store.entity';
import { User } from 'src/entities/User.entity';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';
import { AuthModule } from '../auth/auth.module';
import { EmailService } from 'src/common/email/email.service';
import { RequestContextModule } from 'src/common/context/request-context/request-context.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, User, Store, Role, StoreUser]),
    AppConfigModule,
    MyLoggerModule,
    RequestContextModule,
    AuthModule, // Importez AuthModule pour utiliser AuthService et les Guards
  ],
  providers: [InvitationService, EmailService], // Fournissez EmailService ici
  controllers: [InvitationController],
  exports: [InvitationService],
})
export class InvitationModule {}
