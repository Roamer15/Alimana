import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/role.dto';
import { RolesService } from './roles.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionKeys } from '../auth/decorators/permissions.decorator';
import { PermissionKey } from '../store/constants/permission-enum';

@UseGuards(StoreJwtGuard, PermissionsGuard)
@PermissionKeys(PermissionKey.MANAGE_ROLES)
@Controller('store/:storeId/roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}
  @Post()
  async createRole(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    return this.rolesService.createRole(storeId, createRoleDto);
  }
  @Get()
  async getRoles(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.rolesService.getAllRoles(storeId);
  }

  @Get(':id')
  async getRoleById(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.rolesService.getRoleById(storeId, id);
  }

  @Patch(':id')
  async updateRole(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(storeId, id, dto);
  }

  @Patch(':id/permissions')
  async updatePermissions(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.rolesService.updateRolePermissions(storeId, id, dto.permissionIds);
  }

  @Delete(':id')
  async deleteRole(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.rolesService.deleteRole(storeId, id);
  }
}
