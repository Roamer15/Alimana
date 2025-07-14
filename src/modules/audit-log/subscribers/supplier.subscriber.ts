import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Supplier } from 'src/entities/supplier.entity';
import { RequestContextService } from 'src/common/context/request-context.service';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { AuditLogService } from '../audit-log.service';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class SupplierSubscriber implements EntitySubscriberInterface<Supplier> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Supplier;
  }

  async afterInsert(event: InsertEvent<Supplier>) {
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
      notes: `Creation of supplier with ID ${entityId}: ${entity.name} for Store ID ${entity.storeId}`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'SupplierSubscriber');
  }

  async beforeUpdate(event: UpdateEvent<Supplier>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(Supplier).findOne({
      where: { id: databaseEntity.id },
      relations: ['store', 'createdBy'], // Load relations for detailed notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<Supplier>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as Supplier;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'SupplierSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<Supplier>(
      entityName,
      entityId,
      oldValue,
      entity as Supplier,
    );

    // Compare fields
    changeTracker.compareField('name', 'Name');
    changeTracker.compareField('email', 'Email');
    changeTracker.compareField('phone', 'Phone');
    changeTracker.compareField('address', 'Address');

    // Audit relations
    changeTracker.compareRelation('store', 'Store', (store) =>
      store ? { id: store.id, name: store.name } : null,
    );
    changeTracker.compareRelation('createdBy', 'Created By (StoreUser)', (user) =>
      user ? { id: user.id, fullName: user.user?.fullName } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Supplier ID ${entityId} (${entity.name}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'SupplierSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'SupplierSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<Supplier>) {
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
      notes: `Deletion of supplier with ID ${entityId}: ${entity?.name} from Store ID ${entity?.storeId}`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'SupplierSubscriber');
  }
}
