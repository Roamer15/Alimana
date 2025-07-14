import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Role } from 'src/entities/role.entity';
import { AuditLogService } from '../audit-log.service';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextService } from 'src/common/context/request-context.service';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class RoleSubscriber implements EntitySubscriberInterface<Role> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Role;
  }

  async afterInsert(event: InsertEvent<Role>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    await this.auditLogsService.createAuditLog({
      storeId: storeId,
      storeUserId,
      actionType: AuditActionType.CREATE,
      entity: entityName,
      entityId: entityId,
      newValue: JSON.parse(JSON.stringify(entity)) as object,
      ipAddress,
      userAgent,
      notes: `Creation of role with ID ${entityId}: ${entity.name} for Store ID ${entity.storeId}`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'RoleSubscriber');
  }

  async beforeUpdate(event: UpdateEvent<Role>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(Role).findOne({
      where: { id: databaseEntity.id },
      relations: ['store', 'createdBy', 'permissions'], // Load relations if you want to audit their names/details
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<Role>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as Role;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'RoleSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<Role>(
      entityName,
      entityId,
      oldValue,
      entity as Role,
    );

    changeTracker.compareField('name', 'Role Name');
    changeTracker.compareField('description', 'Description');
    changeTracker.compareField('isDefault', 'Is Default');

    // Audit store change by ID and name if relation loaded
    changeTracker.compareRelation('store', 'Store', (store) =>
      store ? { id: store.id, name: store.name } : null,
    );

    // Audit createdBy user change by ID and fullName if relation loaded
    changeTracker.compareRelation('createdBy', 'Created By', (user) =>
      user ? { id: user.id, fullName: user.user?.fullName } : null,
    );

    // Audit permissions (comparing array of IDs)
    const oldPermissionIds = oldValue.permissions?.map((p) => p.id).sort() || [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    const newPermissionIds = entity.permissions?.map((p) => p.id).sort() || [];
    if (JSON.stringify(oldPermissionIds) !== JSON.stringify(newPermissionIds)) {
      changeTracker.addNote(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        `Permissions changed from [${oldPermissionIds.join(', ')}] to [${newPermissionIds.join(', ')}]`,
      );
      changeTracker.getOldValues()['permissions'] = oldPermissionIds;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      changeTracker.getNewValues()['permissions'] = newPermissionIds;
      changeTracker.getChangedFields().push('permissions');
    }

    if (changeTracker.hasChanges()) {
      const notes = `Role ID ${entityId} (${entity.name}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

      await this.auditLogsService.createAuditLog(
        changeTracker.getAuditLogPayload({
          storeId: storeId,
          storeUserId,
          actionType: AuditActionType.UPDATE,
          ipAddress,
          userAgent,
          notes: notes,
        }),
      );

      this.logger.log(
        `Audit: ${entityName} updated with ID ${entityId}. Fields changed: ${changeTracker.getChangedFields().join(', ')}`,
        'RoleSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'RoleSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<Role>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    await this.auditLogsService.createAuditLog({
      storeId: storeId,
      storeUserId,
      actionType: AuditActionType.DELETE,
      entity: entityName,
      entityId: entityId,
      oldValue: JSON.parse(JSON.stringify(entity)) as object,
      newValue: null,
      ipAddress,
      userAgent,
      notes: `Deletion of role with ID ${entityId}: ${entity?.name} from Store ID ${entity?.storeId}`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'RoleSubscriber');
  }
}
