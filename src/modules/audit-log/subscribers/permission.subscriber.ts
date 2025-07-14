import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../audit-log.service';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextService } from 'src/common/context/request-context.service';
import { Permission } from 'src/entities/permission.entity';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class PermissionSubscriber implements EntitySubscriberInterface<Permission> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Permission;
  }

  async afterInsert(event: InsertEvent<Permission>) {
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
      notes: `Creation of permission with ID ${entityId}: '${entity.key}' (${entity.label})`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'PermissionSubscriber');
  }

  async beforeUpdate(event: UpdateEvent<Permission>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(Permission).findOne({
      where: { id: databaseEntity.id },
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<Permission>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as Permission;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'PermissionSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<Permission>(
      entityName,
      entityId,
      oldValue,
      entity as Permission,
    );

    // Compare fields
    changeTracker.compareField('key', 'Permission Key');
    changeTracker.compareField('label', 'Permission Label');

    if (changeTracker.hasChanges()) {
      const notes = `Permission ID ${entityId} ('${entity.key}') updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

      await this.auditLogsService.createAuditLog(
        changeTracker.getAuditLogPayload({
          storeId: storeId, // May be null or a system-wide ID
          storeUserId,
          actionType: AuditActionType.UPDATE,
          ipAddress,
          userAgent,
          notes: notes,
        }),
      );

      this.logger.log(
        `Audit: ${entityName} updated with ID ${entityId}. Fields changed: ${changeTracker.getChangedFields().join(', ')}`,
        'PermissionSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'PermissionSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<Permission>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    await this.auditLogsService.createAuditLog({
      storeId: storeId, // May be null or a system-wide ID
      storeUserId,
      actionType: AuditActionType.DELETE,
      entity: entityName,
      entityId: entityId,
      oldValue: JSON.parse(JSON.stringify(entity)) as object,
      newValue: null,
      ipAddress,
      userAgent,
      notes: `Deletion of permission with ID ${entityId}: '${entity?.key}'`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'PermissionSubscriber');
  }
}
