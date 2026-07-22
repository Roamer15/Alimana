import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/entities/permission.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { Repository } from 'typeorm';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission) private permissionRepository: Repository<Permission>,
    private readonly logger: MyLoggerService,
  ) {}

  async getPermissions(): Promise<Permission[]> {
    try {
      this.logger.log('Fetching all permissions');
      return await this.permissionRepository.find();
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error('Error fetching permissions', error.stack || error.message);
        throwHttpError(ErrorCode.PERMISSION_FETCH_FAILED, { error: error.message });
      }
      throwHttpError(ErrorCode.PERMISSION_FETCH_FAILED, { error: String(error) });
    }
  }
}
