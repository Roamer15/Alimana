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
import { CustomerReturnItem } from 'src/entities/customer-return-item.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextService } from 'src/common/context/request-context.service';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class CustomerReturnItemSubscriber implements EntitySubscriberInterface<CustomerReturnItem> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return CustomerReturnItem;
  }

  async afterInsert(event: InsertEvent<CustomerReturnItem>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    // For CustomerReturnItem, get storeId from CustomerReturn
    await this.auditLogsService.createAuditLog({
      storeId: storeId,
      storeUserId,
      actionType: AuditActionType.CREATE,
      entity: entityName,
      entityId: entityId,
      newValue: JSON.parse(JSON.stringify(entity)) as object,
      ipAddress,
      userAgent,
      notes: `Creation of customer return item with ID ${entityId} for Return ID ${entity.customerReturnId} (Product ID: ${entity.productId}, Qty: ${entity.quantity})`,
    });
    this.logger.log(
      `Audit: ${entityName} created with ID ${entityId}`,
      'CustomerReturnItemSubscriber',
    );
  }

  async beforeUpdate(event: UpdateEvent<CustomerReturnItem>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(CustomerReturnItem).findOne({
      where: { id: databaseEntity.id },
      relations: ['customerReturn', 'product'], // Load relations for detailed notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<CustomerReturnItem>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as CustomerReturnItem;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'CustomerReturnItemSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<CustomerReturnItem>(
      entityName,
      entityId,
      oldValue,
      entity as CustomerReturnItem,
    );

    // Compare fields
    changeTracker.compareField('quantity', 'Quantity');
    changeTracker.compareField('unitPrice', 'Unit Price');
    changeTracker.compareField('refundAmount', 'Refund Amount');
    changeTracker.compareField('reason', 'Reason');

    // Audit relations
    changeTracker.compareRelation('customerReturn', 'Customer Return', (ret) =>
      ret ? { id: ret.id } : null,
    );
    changeTracker.compareRelation('product', 'Product', (product) =>
      product ? { id: product.id, name: product.name } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Customer Return Item ID ${entityId} (Product ID: ${entity.productId}, Return ID: ${entity.customerReturnId}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;
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
        'CustomerReturnItemSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'CustomerReturnItemSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<CustomerReturnItem>) {
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
      notes: `Deletion of customer return item with ID ${entityId} (Product ID: ${entity?.productId}, Return ID: ${entity?.customerReturnId})`,
    });
    this.logger.log(
      `Audit: ${entityName} deleted with ID ${entityId}`,
      'CustomerReturnItemSubscriber',
    );
  }
}
