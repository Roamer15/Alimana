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
      return await this.roleRepository.find({
        where: { storeId },
        relations: ['permissions'],
      });
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
  async updateRole(storeId: number, id: number, updateData: Partial<Role>): Promise<Role> {
    this.validateStoreAccess(storeId);

    try {
      this.logger.log(`Updating role ID ${id} in store ${storeId}`);

      // 1. First verify ownership
      const existingRole = await this.roleRepository.findOne({
        where: { id, storeId }, // Critical security filter
      });

      if (!existingRole) {
        this.logger.warn(`Role ${id} not found in store ${storeId}`);
        throwHttpError(ErrorCode.ROLE_NOT_FOUND, { id, storeId });
      }

      // 2. Apply updates safely
      Object.assign(existingRole, updateData);
      const updatedRole = await this.roleRepository.save(existingRole);

      this.logger.log(`Successfully updated role ${id} in store ${storeId}`);
      return updatedRole;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to update role ${id} in store ${storeId}`,
          error.stack || error.message,
        );
        throwHttpError(ErrorCode.ROLE_UPDATE_FAILED, {
          id,
          storeId,
          error: error.message,
        });
      }
      throwHttpError(ErrorCode.ROLE_UPDATE_FAILED, {
        id,
        storeId,
        error: String(error),
      });
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
    this.validateStoreAccess(storeId); // Keep request-level validation

    try {
      this.logger.log(`Attempting to delete role ID ${id} from store ${storeId}`);

      // First verify the role exists AND belongs to this store
      const role = await this.roleRepository.findOne({
        where: { id, storeId }, // Critical: Compound where clause
      });

      if (!role) {
        this.logger.warn(`Role ${id} not found in store ${storeId}`);
        throwHttpError(ErrorCode.ROLE_NOT_FOUND, { id, storeId });
      }

      // Only then proceed with deletion
      await this.roleRepository.remove(role);
      this.logger.log(`Successfully deleted role ${id} from store ${storeId}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to delete role ${id} from store ${storeId}`,
          error.stack || error.message,
        );
        throwHttpError(ErrorCode.ROLE_DELETE_FAILED, {
          id,
          storeId,
          error: error.message,
        });
      }
      throwHttpError(ErrorCode.ROLE_DELETE_FAILED, {
        id,
        storeId,
        error: String(error),
      });
    }
  }
}
