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
import { SupplierOrderItems } from 'src/entities/supplier-order-item.entity';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class SupplierOrderItemsSubscriber implements EntitySubscriberInterface<SupplierOrderItems> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return SupplierOrderItems;
  }

  async afterInsert(event: InsertEvent<SupplierOrderItems>) {
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
      notes: `Creation of supplier order item with ID ${entityId} for Order ID ${entity.supplierOrderId} (Product ID: ${entity.productId}, Qty: ${entity.quantity}, Cost: ${entity.unitCost})`,
    });
    this.logger.log(
      `Audit: ${entityName} created with ID ${entityId}`,
      'SupplierOrderItemsSubscriber',
    );
  }

  async beforeUpdate(event: UpdateEvent<SupplierOrderItems>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(SupplierOrderItems).findOne({
      where: { id: databaseEntity.id },
      relations: ['supplier_order', 'product'], // Load relations for detailed notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<SupplierOrderItems>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as SupplierOrderItems;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'SupplierOrderItemsSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<SupplierOrderItems>(
      entityName,
      entityId,
      oldValue,
      entity as SupplierOrderItems,
    );

    // Compare fields
    changeTracker.compareField('quantity', 'Quantity');
    changeTracker.compareField('unitCost', 'Unit Cost');
    changeTracker.compareField('totalCost', 'Total Cost');
    changeTracker.compareField('receivedQuantity', 'Received Quantity');

    // Audit relations
    changeTracker.compareRelation('supplier_order', 'Supplier Order', (order) =>
      order ? { id: order.id, status: order.status } : null,
    );
    changeTracker.compareRelation('product', 'Product', (product) =>
      product ? { id: product.id, name: product.name } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Supplier Order Item ID ${entityId} (Product ID: ${entity.productId}, Order ID: ${entity.supplierOrderId}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

      // // Get storeId from SupplierOrders
      // const associatedOrder = await event.manager
      //   .getRepository('SupplierOrders')
      //   .findOne({ where: { id: entity.supplierOrderId }, select: ['storeId'] });
      // const effectiveStoreId = associatedOrder?.storeId || storeId; // Fallback to context storeId if not found

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
        'SupplierOrderItemsSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'SupplierOrderItemsSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<SupplierOrderItems>) {
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
      notes: `Deletion of supplier order item with ID ${entityId} (Product ID: ${entity?.productId}, Order ID: ${entity?.supplierOrderId})`,
    });
    this.logger.log(
      `Audit: ${entityName} deleted with ID ${entityId}`,
      'SupplierOrderItemsSubscriber',
    );
  }
}
