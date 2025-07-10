import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly config: NestConfigService) {}

  get dbHost(): string | undefined {
    return this.config.get<string>('DB_HOST');
  }

  get dbPort(): number | undefined {
    return this.config.get<number>('DB_PORT');
  }

  get dbUsername(): string | undefined {
    return this.config.get<string>('DB_USERNAME');
  }

  get dbPassword(): string | undefined {
    return this.config.get<string>('DB_PASSWORD');
  }

  get dbName(): string | undefined {
    return this.config.get<string>('DB_NAME');
  }

  get typeormLogging(): boolean | undefined {
    return this.config.get<boolean>('TYPEORM_LOGGING');
  }

  // 🔐 Auth
  get jwtSecret(): string | undefined {
    return this.config.get<string>('JWT_SECRET');
  }

  get jwtExpiresIn(): string | undefined {
    return this.config.get<string>('JWT_EXPIRES_IN');
  }

  // 📧 Mailing
  get mailHost(): string | undefined {
    return this.config.get<string>('MAIL_HOST');
  }

  get mailPort(): number | undefined {
    return this.config.get<number>('MAIL_PORT');
  }

  get mailUser(): string | undefined {
    return this.config.get<string>('MAIL_USER');
  }

  get mailPassword(): string | undefined {
    return this.config.get<string>('MAIL_PASSWORD');
  }
}
