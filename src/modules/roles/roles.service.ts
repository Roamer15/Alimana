import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/role.dto';
import { Role } from 'src/entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from 'src/entities/permission.entity';
import { Repository, In } from 'typeorm';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private readonly requestContextService: RequestContextService,
    private readonly logger: MyLoggerService,
  ) {}

  private validateStoreAccess(storeId: number): void {
    const { storeId: contextStoreId } = this.requestContextService.getContext();

    if (!contextStoreId) {
      throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);
    }

    if (contextStoreId !== storeId) {
      throwHttpError(ErrorCode.FORBIDDEN, {
        reason: 'Access denied. You can only view settings for your current store.',
      });
    }
  }

  /**
   * Create a new role and assign permissions to it.
   */
  async createRole(storeId: number, dto: CreateRoleDto): Promise<Role> {
    this.validateStoreAccess(storeId);
    return await this.roleRepository.manager.transaction(async (manager) => {
      try {
        this.logger.log(
          `Creating role: ${dto.name} with permissions: ${dto.permissionIds.join(', ')}`,
        );
        const { permissionIds, ...roleData } = dto;

        // Fetch permissions within transaction
        const uniquePermissionIds = [...new Set(permissionIds)];
        const permissions = await manager.find(Permission, {
          where: { id: In(uniquePermissionIds) },
        });
        if (permissions.length !== uniquePermissionIds.length) {
          // Identify missing IDs
          const foundIds = new Set(permissions.map((p) => p.id));
          const missingIds = uniquePermissionIds.filter((id) => !foundIds.has(id));
          throwHttpError(ErrorCode.PERMISSION_NOT_FOUND, { missingIds });
        }

        const { storeUserId: createdByUserId } = this.requestContextService.getContext();
        if (!createdByUserId) {
          throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND, { field: 'storeUserId' });
        }
        // Create role and assign permissions within the same transaction
        const role = manager.getRepository(Role).create({
          ...roleData,
          permissions,
          storeId,
          createdByUserId,
        });

        const savedRole = await manager.getRepository(Role).save(role);
        this.logger.log(`Role created with ID: ${savedRole.id} and name: ${savedRole.name}`);

        return savedRole;
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(
            'Error creating role (transaction rolled back)',
            error.stack || error.message,
          );
          throwHttpError(ErrorCode.ROLE_CREATION_FAILED, { error: error.message });
        }
        throwHttpError(ErrorCode.ROLE_CREATION_FAILED, { error: String(error) });
      }
    });
  }

  /**
   * Retrieve all roles from the database, including their permissions.
   */
  async getAllRoles(storeId: number): Promise<Role[]> {
    this.validateStoreAccess(storeId);
    try {
      this.logger.log('Fetching all roles');
      return await this.roleRepository.find({ relations: ['permissions'] });
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error('Error fetching all roles', error.stack || error.message);
        throwHttpError(ErrorCode.ROLE_FETCH_FAILED, { error: error.message });
      }
      // If error is not an instance of Error, throw a generic error
      throwHttpError(ErrorCode.ROLE_FETCH_FAILED, { error: String(error) });
    }
  }

  /**
   * Retrieve a single role by its ID, including its permissions.
   */
  async getRoleById(storeId: number, id: number): Promise<Role | null> {
    this.validateStoreAccess(storeId);
    try {
      this.logger.log(`Fetching role by ID: ${id}`);
      const role = await this.roleRepository.findOne({
        where: { id },
        relations: ['permissions'],
      });
      if (!role) {
        this.logger.warn(`Role with ID ${id} not found`);
        throwHttpError(ErrorCode.ROLE_NOT_FOUND, { id });
      }
      return role;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error fetching role by ID: ${id}`, error.stack || error.message);
        throwHttpError(ErrorCode.ROLE_FETCH_FAILED, { id, error: error.message });
      }
      // If error is not an instance of Error, throw a generic error
      throwHttpError(ErrorCode.ROLE_FETCH_FAILED, { error: String(error) });
    }
  }

  /**
   * Update the basic properties of a role (not its permissions).
   */
  async updateRole(storeId: number, id: number, updateData: Partial<Role>): Promise<Role | null> {
    this.validateStoreAccess(storeId);
    try {
      this.logger.log(`Updating role ID: ${id} with data: ${JSON.stringify(updateData)}`);
      const result = await this.roleRepository.update(id, updateData);
      if (result.affected === 0) {
        this.logger.warn(`Role with ID ${id} not found for update`);
        throwHttpError(ErrorCode.ROLE_NOT_FOUND, { id });
      }
      return this.getRoleById(storeId, id);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error updating role ID: ${id}`, error.stack || error.message);
        throwHttpError(ErrorCode.ROLE_UPDATE_FAILED, { id, error: error.message });
      }
      // If error is not an instance of Error, throw a generic error
      throwHttpError(ErrorCode.ROLE_UPDATE_FAILED, { id, error: String(error) });
    }
  }

  /**
   * Update the permissions assigned to a role.
   */
  async updateRolePermissions(
    storeId: number,
    roleId: number,
    permissionIds: number[],
  ): Promise<Role> {
    return await this.roleRepository.manager.transaction(async (manager) => {
      this.validateStoreAccess(storeId);
      try {
        this.logger.log(
          `Updating permissions for role ID: ${roleId} to [${permissionIds.join(', ')}]`,
        );

        const role = await manager.getRepository(Role).findOne({
          where: { id: roleId },
          relations: ['permissions'],
        });

        if (!role) {
          this.logger.warn(`Role with ID ${roleId} not found`);
          throwHttpError(ErrorCode.ROLE_NOT_FOUND, { roleId });
        }

        const permissions = await manager.getRepository(Permission).find({
          where: { id: In(permissionIds) },
        });

        if (permissions.length !== permissionIds.length) {
          this.logger.warn(`Some permissions not found for IDs:  + permissionIds.join(', ')`);
          throwHttpError(ErrorCode.PERMISSION_NOT_FOUND, { permissionIds });
        }

        role.permissions = permissions;

        const updatedRole = await manager.getRepository(Role).save(role);
        this.logger.log(`Updated permissions for role ID: ${updatedRole.id}`);

        return updatedRole;
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(
            `Error updating permissions for role ID: ${roleId} (transaction rolled back)`,
            error.stack || error.message,
          );
          throwHttpError(ErrorCode.ROLE_UPDATE_FAILED, { roleId, error: error.message });
        }
        throwHttpError(ErrorCode.ROLE_UPDATE_FAILED, { roleId, error: String(error) });
      }
    });
  }

  /**
   * Delete a role by its ID.
   */
  async deleteRole(storeId: number, id: number): Promise<void> {
    this.validateStoreAccess(storeId);
    try {
      this.logger.log(`Deleting role with ID: ${id}`);
      const result = await this.roleRepository.delete(id);
      if (result.affected === 0) {
        this.logger.warn(`Role with ID ${id} not found for deletion`);
        throwHttpError(ErrorCode.ROLE_NOT_FOUND, { id });
      }
      this.logger.log(`Role with ID: ${id} deleted`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error deleting role with ID: ${id}`, error.stack || error.message);
        throwHttpError(ErrorCode.ROLE_DELETE_FAILED, { id, error: error.message });
      }
    }
  }
}
