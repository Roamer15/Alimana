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
import { SupplierOrders, SupplierOrderStatus } from 'src/entities/supplier-order.entity';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class SupplierOrdersSubscriber implements EntitySubscriberInterface<SupplierOrders> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return SupplierOrders;
  }

  async afterInsert(event: InsertEvent<SupplierOrders>) {
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
      notes: `Supplier Order ID ${entityId} created for Store ID ${entity.storeId} (Supplier ID: ${entity.supplierId}, Status: ${entity.status})`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'SupplierOrdersSubscriber');
  }

  async beforeUpdate(event: UpdateEvent<SupplierOrders>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(SupplierOrders).findOne({
      where: { id: databaseEntity.id },
      relations: ['store', 'supplier', 'orderedBy'], // Load relations for detailed notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<SupplierOrders>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as SupplierOrders;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'SupplierOrdersSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<SupplierOrders>(
      entityName,
      entityId,
      oldValue,
      entity as SupplierOrders,
    );

    // Compare fields
    changeTracker.compareField('orderedAt', 'Ordered At');
    changeTracker.compareField('receivedAt', 'Received At');
    changeTracker.compareField('notes', 'Notes');

    const statusChanged = changeTracker.compareField('status', 'Status');
    if (statusChanged) {
      changeTracker.addNote(
        `Order ID ${entityId} status changed from ${oldValue.status} to ${entity.status}.`,
      );
      if (entity.status === SupplierOrderStatus.RECEIVED) {
        changeTracker.addNote(`Order ID ${entityId} was marked as received.`);
      } else if (entity.status === SupplierOrderStatus.CANCELLED) {
        changeTracker.addNote(`Order ID ${entityId} was cancelled.`);
      }
    }

    // Audit relations
    changeTracker.compareRelation('store', 'Store', (store) =>
      store ? { id: store.id, name: store.name } : null,
    );
    changeTracker.compareRelation('supplier', 'Supplier', (supplier) =>
      supplier ? { id: supplier.id, name: supplier.name } : null,
    );
    changeTracker.compareRelation('orderedBy', 'Ordered By (StoreUser)', (user) =>
      user ? { id: user.id, fullName: user.user?.fullName } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Supplier Order ID ${entityId} (Status: ${entity.status}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'SupplierOrdersSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'SupplierOrdersSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<SupplierOrders>) {
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
      notes: `Deletion of Supplier Order ID ${entityId} (Status: ${entity?.status}) from Store ID ${entity?.storeId}`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'SupplierOrdersSubscriber');
  }
}
