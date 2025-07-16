import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/role.dto';
import { Role } from 'src/entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/entities/permission.entity';
import { Repository, In } from 'typeorm';
import { MyLoggerService } from 'src/my-logger/my-logger.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private readonly logger: MyLoggerService,
  ) {}

  /**
   * Create a new role and assign permissions to it.
   * @param dto Data Transfer Object containing role details and permission IDs.
   * @returns The created Role entity.
   */
  async createRole(dto: CreateRoleDto): Promise<Role> {
    this.logger.log(`Creating role: ${dto.name} with permissions: ${dto.permissionIds.join(', ')}`);
    const { permissionIds, ...roleData } = dto;

    // Fetch permissions from the database
    const permissions = await this.permissionRepository.find({ where: { id: In(permissionIds) } });
    this.logger.log(`Fetched permissions: ${permissions.map((p) => p.id).join(', ')}`);

    // Create the role entity with the fetched permissions
    const role = this.roleRepository.create({
      ...roleData,
      permissions,
    });

    // Save the new role to the database
    const savedRole = await this.roleRepository.save(role);
    this.logger.log(`Role created with ID: ${savedRole.id} and name: ${savedRole.name}`);

    return savedRole;
  }

  /**
   * Retrieve all roles from the database, including their permissions.
   * @returns Array of Role entities.
   */
  async getAllRoles(): Promise<Role[]> {
    this.logger.log('Fetching all roles');
    return this.roleRepository.find({ relations: ['permissions'] });
  }

  /**
   * Retrieve a single role by its ID, including its permissions.
   * @param id Role ID.
   * @returns The Role entity or null if not found.
   */
  async getRoleById(id: number): Promise<Role | null> {
    this.logger.log(`Fetching role by ID: ${id}`);
    return this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
  }

  /**
   * Update the basic properties of a role (not its permissions).
   * @param id Role ID.
   * @param updateData Partial role data to update.
   * @returns The updated Role entity or null if not found.
   */
  async updateRole(id: number, updateData: Partial<Role>): Promise<Role | null> {
    this.logger.log(`Updating role ID: ${id} with data: ${JSON.stringify(updateData)}`);
    await this.roleRepository.update(id, updateData);
    return this.getRoleById(id);
  }

  /**
   * Update the permissions assigned to a role.
   * @param roleId Role ID.
   * @param permissionIds Array of permission IDs to assign.
   * @returns The updated Role entity or null if not found.
   */
  async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<Role | null> {
    this.logger.log(`Updating permissions for role ID: ${roleId} to [${permissionIds.join(', ')}]`);

    // 1. Find the role with its current permissions
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });
    if (!role) {
      this.logger.warn(`Role with ID ${roleId} not found`);
      return null;
    }

    // 2. Fetch the new permissions
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });
    this.logger.log(`Fetched new permissions: ${permissions.map((p) => p.id).join(', ')}`);

    // 3. Assign the new permissions to the role
    role.permissions = permissions;

    // 4. Save and return the updated role
    const updatedRole = await this.roleRepository.save(role);
    this.logger.log(`Updated permissions for role ID: ${updatedRole.id}`);
    return updatedRole;
  }

  /**
   * Delete a role by its ID.
   * @param id Role ID.
   */
  async deleteRole(id: number): Promise<void> {
    this.logger.log(`Deleting role with ID: ${id}`);
    await this.roleRepository.delete(id);
    this.logger.log(`Role with ID: ${id} deleted`);
  }
}
