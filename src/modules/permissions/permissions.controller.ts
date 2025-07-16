import { Controller, Get } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private permissionService: PermissionsService) {}

  @Get()
  async getAllPermissions() {
    return this.permissionService.getPermissions();
  }
}
