import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/role.dto';
import { Role } from 'src/entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/entities/permission.entity';
import { Repository, In } from 'typeorm';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}
  async createRole(dto: CreateRoleDto): Promise<Role> {
    const { permissionIds, ...roleData } = dto;

    const permissions = await this.permissionRepository.find({ where: { id: In(permissionIds) } });

    const role = this.roleRepository.create({
      ...roleData,
      permissions,
    });

    return this.roleRepository.save(role);
  }
}
