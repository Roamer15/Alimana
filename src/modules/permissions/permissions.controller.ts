import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';

@UseGuards(StoreJwtGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private permissionService: PermissionsService) {}

  @Get()
  async getAllPermissions() {
    return this.permissionService.getPermissions();
  }
}
