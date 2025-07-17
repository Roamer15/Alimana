import { Body, Controller, Get, Param, Post, Patch, UseGuards } from '@nestjs/common';
import { CreateRoleDto } from './dto/role.dto';
import { RolesService } from './roles.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}
  @UseGuards(StoreJwtGuard)
  @Post()
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Get()
  async getRoles() {
    return this.rolesService.getAllRoles();
  }

  @Get(':id')
  async getRoleById(@Param('id') id: number) {
    return this.rolesService.getRoleById(id);
  }

  @Patch(':id')
  async updateRole(@Param('id') id: number, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, dto);
  }

  @Patch(':id/permissions')
  async updatePermissions(@Param('id') id: number, @Body() dto: UpdateRolePermissionsDto) {
    return this.rolesService.updateRolePermissions(id, dto.permissionIds);
  }
}
