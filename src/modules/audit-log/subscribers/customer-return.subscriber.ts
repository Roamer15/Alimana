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
import { CustomerReturn, ReturnStatus } from 'src/entities/customer-return.entity';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class CustomerReturnSubscriber implements EntitySubscriberInterface<CustomerReturn> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return CustomerReturn;
  }

  async afterInsert(event: InsertEvent<CustomerReturn>) {
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
      notes: `Creation of customer return with ID ${entityId} for Sale ID ${entity.saleId} (Total Refund: ${entity.totalRefund})`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'CustomerReturnSubscriber');
  }

  async beforeUpdate(event: UpdateEvent<CustomerReturn>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(CustomerReturn).findOne({
      where: { id: databaseEntity.id },
      relations: ['store', 'sale', 'processedBy'], // Load relations for detailed notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<CustomerReturn>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as CustomerReturn;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'CustomerReturnSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<CustomerReturn>(
      entityName,
      entityId,
      oldValue,
      entity as CustomerReturn,
    );

    // Compare fields
    changeTracker.compareField('totalRefund', 'Total Refund');
    changeTracker.compareField('reason', 'Reason');

    const statusChanged = changeTracker.compareField('status', 'Status');
    if (statusChanged) {
      changeTracker.addNote(
        `Return ID ${entityId} status changed from ${oldValue.status} to ${entity.status}.`,
      );
      if (entity.status === ReturnStatus.PROCESSED) {
        changeTracker.addNote(`Return ID ${entityId} was processed.`);
      } else if (entity.status === ReturnStatus.CANCELLED) {
        changeTracker.addNote(`Return ID ${entityId} was cancelled.`);
      }
    }

    // Audit relations
    changeTracker.compareRelation('store', 'Store', (store) =>
      store ? { id: store.id, name: store.name } : null,
    );
    changeTracker.compareRelation('sale', 'Sale', (sale) =>
      sale ? { id: sale.id, totalAmount: sale.totalAmount } : null,
    );
    changeTracker.compareRelation('processedBy', 'Processed By (StoreUser)', (user) =>
      user ? { id: user.id, fullName: user.user?.fullName } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Customer Return ID ${entityId} (Sale ID: ${entity.saleId}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'CustomerReturnSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'CustomerReturnSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<CustomerReturn>) {
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
      notes: `Deletion of customer return with ID ${entityId} (Sale ID: ${entity?.saleId}) from Store ID ${entity?.storeId}`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'CustomerReturnSubscriber');
  }
}
