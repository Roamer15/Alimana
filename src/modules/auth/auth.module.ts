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

import { RequestContextModule } from 'src/common/context/request-context/request-context.module';
import { MyLoggerModule } from 'src/my-logger/my-logger.module';

@Module({
  imports: [
    AppConfigModule,
    RequestContextModule,
    MyLoggerModule,
    TypeOrmModule.forFeature([User, UserRefreshToken, StoreUser]),
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
  exports: [AuthService, LocalStrategy],
})
export class AuthModule {}
