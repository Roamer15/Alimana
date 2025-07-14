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
import { Product } from 'src/entities/product.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextService } from 'src/common/context/request-context.service';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class ProductSubscriber implements EntitySubscriberInterface<Product> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Product;
  }

  async afterInsert(event: InsertEvent<Product>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    await this.auditLogsService.createAuditLog({
      storeId: entity.storeId,
      storeUserId,
      actionType: AuditActionType.CREATE,
      entity: entityName,
      entityId: entityId,
      newValue: JSON.parse(JSON.stringify(entity)) as object,
      ipAddress,
      userAgent,
      notes: `Creation of product with ID ${entityId}: ${entity.name} (Store ID: ${entity.storeId})`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'ProductSubscriber');
  }

  async beforeUpdate(event: UpdateEvent<Product>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(Product).findOne({
      where: { id: databaseEntity.id },
      relations: ['category', 'createdBy', 'store'], // Load relations for better notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<Product>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as Product;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'ProductSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<Product>(
      entityName,
      entityId,
      oldValue,
      entity as Product,
    );

    // Compare product-specific fields
    changeTracker.compareField('name', 'Product Name');
    changeTracker.compareField('description', 'Description');
    changeTracker.compareField('barcode', 'Barcode');
    changeTracker.compareField('sku', 'SKU');
    changeTracker.compareField('brand', 'Brand');
    changeTracker.compareField('unit', 'Unit');
    changeTracker.compareField('sellingPrice', 'Selling Price');
    changeTracker.compareField('costPrice', 'Cost Price');
    changeTracker.compareField('discountPercentage', 'Discount Percentage');
    changeTracker.compareField('quantityInStock', 'Quantity In Stock');
    changeTracker.compareField('isActive', 'Is Active');
    changeTracker.compareField('imageUrl', 'Image URL');

    // Audit category relation by ID and name
    changeTracker.compareRelation('category', 'Category', (category) =>
      category ? { id: category.id, name: category.name } : null,
    );
    // Audit createdBy relation by ID and full name
    changeTracker.compareRelation('createdBy', 'Created By', (user) =>
      user ? { id: user.id, fullName: user.user?.fullName } : null,
    );
    // Audit store relation by ID and name
    changeTracker.compareRelation('store', 'Store', (store) =>
      store ? { id: store.id, name: store.name } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Product ID ${entityId} (${entity.name}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'ProductSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'ProductSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<Product>) {
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
      notes: `Deletion of product with ID ${entityId}: ${entity?.name} from Store ID ${entity?.storeId}`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'ProductSubscriber');
  }
}
