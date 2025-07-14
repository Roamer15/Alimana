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
import { SaleItem } from 'src/entities/sale-item.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';
import { AuditActionType } from 'src/entities/audit-logs.entity';

@Injectable()
@EventSubscriber()
export class SaleItemSubscriber implements EntitySubscriberInterface<SaleItem> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return SaleItem;
  }

  async afterInsert(event: InsertEvent<SaleItem>) {
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
      notes: `Creation of sale item with ID ${entityId} for Sale ID ${entity.saleId} (Product: ${entity.productName}, Qty: ${entity.quantity})`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'SaleItemSubscriber');
  }

  async beforeUpdate(event: UpdateEvent<SaleItem>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(SaleItem).findOne({
      where: { id: databaseEntity.id },
      relations: ['sale', 'product'], // Load relations for better notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<SaleItem>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as SaleItem;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'SaleItemSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<SaleItem>(
      entityName,
      entityId,
      oldValue,
      entity as SaleItem,
    );

    // Compare fields
    changeTracker.compareField('quantity', 'Quantity');
    changeTracker.compareField('productName', 'Product Name (at Sale)');
    changeTracker.compareField('originalPrice', 'Original Price');
    changeTracker.compareField('unitPrice', 'Unit Price');
    changeTracker.compareField('discountPercentage', 'Discount Percentage');
    changeTracker.compareField('totalPrice', 'Total Price');

    // Audit relations (Sale and Product)
    changeTracker.compareRelation('sale', 'Sale', (sale) => (sale ? { id: sale.id } : null));
    changeTracker.compareRelation('product', 'Product', (product) =>
      product ? { id: product.id, name: product.name } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Sale Item ID ${entityId} (Product: ${entity.productName}, Sale ID: ${entity.saleId}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'SaleItemSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'SaleItemSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<SaleItem>) {
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
      notes: `Deletion of sale item with ID ${entityId} (Product: ${entity?.productName}, Sale ID: ${entity?.saleId})`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'SaleItemSubscriber');
  }
}
