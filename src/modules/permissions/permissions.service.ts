import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/entities/permission.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission) private permissionRepository: Repository<Permission>,
    private readonly logger: MyLoggerService,
  ) {}

  async getPermissions(): Promise<Permission[]> {
    this.logger.log('Fetching all permissions');
    return await this.permissionRepository.find();
  }
}
