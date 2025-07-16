import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

import { AppConfigService } from '../../config/config.service';
import { AuthProvider, User } from '../../entities/User.entity';
import { UserRefreshToken } from '../../entities/user-refresh-token.entity';
import { StoreUser, StoreUserStatus } from '../../entities/store-user.entity';
import { RegisterDto } from './dto/register.dto';
import { ErrorCode } from '../../common/errors/error-codes.enum';
import { throwHttpError } from '../../common/errors/http-exception.helper';
import { Profile } from 'passport-google-oauth20';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { MyLoggerService } from 'src/my-logger/my-logger.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserRefreshToken)
    private readonly userRefreshTokensRepository: Repository<UserRefreshToken>,
    @InjectRepository(StoreUser)
    private readonly storeUsersRepository: Repository<StoreUser>,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
    private readonly requestContextService: RequestContextService,
    private readonly logger: MyLoggerService,
  ) {}

  async registerLocal(registerDto: RegisterDto): Promise<User> {
    const { fullName, email, password, phone } = registerDto;

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throwHttpError(ErrorCode.EMAIL_ALREADY_USED, { email });
    }

    if (!password) {
      throwHttpError(ErrorCode.VALIDATION_FAILED, { reason: 'Password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.usersRepository.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
      canCreateStore: true,
    });

    return await this.usersRepository.save(newUser);
  }

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || !user.password) {
      throwHttpError(ErrorCode.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throwHttpError(ErrorCode.INVALID_CREDENTIALS);
    }

    return user;
  }

  async findOrCreateGoogleUser(profile: Profile): Promise<User> {
    const email = profile.emails?.[0]?.value;
    const googleId = profile.id;
    const fullName = profile.displayName;
    const avatarUrl = profile.photos?.[0]?.value;

    if (!email || !googleId || !fullName) {
      throwHttpError(ErrorCode.VALIDATION_FAILED, { reason: 'Incomplete Google profile' });
    }

    let user = await this.usersRepository.findOne({
      where: { providerId: googleId, authProvider: AuthProvider.GOOGLE },
    });

    if (user) return user;

    user = await this.usersRepository.findOne({ where: { email } });

    if (user) {
      if (user.authProvider === AuthProvider.GOOGLE && !user.providerId) {
        user.providerId = googleId;
        return this.usersRepository.save(user);
      }

      throwHttpError(ErrorCode.EMAIL_ALREADY_USED, {
        email,
        reason: `Email already used with ${user.authProvider}`,
      });
    }

    const newUser = this.usersRepository.create({
      email,
      fullName,
      providerId: googleId,
      avatarUrl,
      authProvider: AuthProvider.GOOGLE,
      canCreateStore: true,
    });

    return this.usersRepository.save(newUser);
  }

  async generateTokens(
    user: User,
    storeUser?: StoreUser,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _req?: Request,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: Record<string, unknown> = {
      userId: user.id,
      email: user.email,
      canCreateStore: user.canCreateStore,
    };

    if (storeUser) {
      const { store, role } = storeUser;

      if (!store?.id || !role?.id || !role.permissions) {
        throw new Error('Incomplete StoreUser relation');
      }

      Object.assign(payload, {
        storeUserId: storeUser.id,
        storeId: store.id,
        roleId: role.id,
        roleName: role.name,
        permissions: role.permissions,
      });
    }

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.jwtAccessTokenExpiration,
    });

    const refreshTokenValue = uuidv4();
    const hashedToken = this.hashToken(refreshTokenValue);
    const refreshExpiresAt = new Date();

    refreshExpiresAt.setDate(
      refreshExpiresAt.getDate() +
        parseInt(this.configService.jwtRefrehTokenExpiration?.replace('d', '') || '7', 10),
    );

    const newRefreshToken = this.userRefreshTokensRepository.create({
      tokenHash: hashedToken,
      expiresAt: refreshExpiresAt,
      user,
      ...(storeUser && { storeUser }),
    });

    await this.userRefreshTokensRepository.save(newRefreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  async refreshTokens(refreshToken: string, req?: Request) {
    const hashedToken = this.hashToken(refreshToken);

    const storedToken = await this.userRefreshTokensRepository.findOne({
      where: { tokenHash: hashedToken, revoked: false },
      relations: [
        'user',
        'storeUser',
        'storeUser.store',
        'storeUser.role',
        'storeUser.role.permissions',
      ],
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken?.user) {
        await this.userRefreshTokensRepository.update(
          { user: storedToken.user, revoked: false },
          { revoked: true },
        );
      }

      throwHttpError(ErrorCode.REFRESH_TOKEN_INVALID, { reason: 'Expired or invalid token' });
    }

    storedToken.revoked = true;
    await this.userRefreshTokensRepository.save(storedToken);

    return this.generateTokens(storedToken.user, storedToken.storeUser, req);
  }

  async logout(refreshToken: string): Promise<void> {
    const hashed = this.hashToken(refreshToken);
    const token = await this.userRefreshTokensRepository.findOne({
      where: { tokenHash: hashed, revoked: false },
    });

    if (token) {
      token.revoked = true;
      await this.userRefreshTokensRepository.save(token);
    }
  }

  async findUserStores(userId: number) {
    const storeUsers = await this.storeUsersRepository.find({
      where: { user: { id: userId }, status: StoreUserStatus.ACTIVE },
      relations: ['store', 'role'],
    });

    return storeUsers.map((su) => {
      const store = su.store as {
        id: number;
        name: string;
        logoUrl?: string;
        profileImageUrl?: string;
      };
      return {
        id: store.id,
        name: store.name,
        storeUserId: su.id,
        roleName: su.role.name,
        logoUrl: store.logoUrl ?? '',
        profileImageUrl: store.profileImageUrl ?? '',
      };
    });
  }

  async selectStore(userId: number, storeUserId: number) {
    const storeUser = await this.storeUsersRepository.findOne({
      where: { id: storeUserId, user: { id: userId } },
      relations: ['user', 'store', 'role', 'role.permissions'],
    });

    if (!storeUser || storeUser.status !== StoreUserStatus.ACTIVE) {
      throwHttpError(ErrorCode.FORBIDDEN, {
        reason: 'Invalid or inactive store access.',
        details: { userId, storeUserId },
      });
    }

    await this.usersRepository.update(userId, { lastSelectedStoreUserId: storeUserId });
    return this.generateTokens(storeUser.user, storeUser);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private compareTokenHash(plainToken: string, hashedToken: string): boolean {
    return this.hashToken(plainToken) === hashedToken;
  }
}
