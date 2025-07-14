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
import { InventoryMovement } from 'src/entities/inventory-movement.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextService } from 'src/common/context/request-context.service';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class InventoryMovementSubscriber implements EntitySubscriberInterface<InventoryMovement> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return InventoryMovement;
  }

  async afterInsert(event: InsertEvent<InventoryMovement>) {
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
      notes: `Inventory Movement ID ${entityId} created: ${entity.type} ${entity.quantity} of Product ID ${entity.productId} (Type: ${entity.movementType}, Source: ${entity.sourceType}:${entity.sourceId}) for Store ID ${entity.storeId}`,
    });
    this.logger.log(
      `Audit: ${entityName} created with ID ${entityId}`,
      'InventoryMovementSubscriber',
    );
  }

  async beforeUpdate(event: UpdateEvent<InventoryMovement>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(InventoryMovement).findOne({
      where: { id: databaseEntity.id },
      relations: ['store', 'product', 'createdBy'], // Load relations for detailed notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<InventoryMovement>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as InventoryMovement;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'InventoryMovementSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<InventoryMovement>(
      entityName,
      entityId,
      oldValue,
      entity as InventoryMovement,
    );

    // Compare fields
    changeTracker.compareField('quantity', 'Quantity');
    changeTracker.compareField('type', 'Movement Type (IN/OUT)');
    changeTracker.compareField('movementType', 'Categorized Movement Type');
    changeTracker.compareField('sourceId', 'Source ID');
    changeTracker.compareField('sourceType', 'Source Type');
    changeTracker.compareField('notes', 'Notes');

    // Audit relations
    changeTracker.compareRelation('store', 'Store', (store) =>
      store ? { id: store.id, name: store.name } : null,
    );
    changeTracker.compareRelation('product', 'Product', (product) =>
      product ? { id: product.id, name: product.name } : null,
    );
    changeTracker.compareRelation('createdBy', 'Created By (StoreUser)', (user) =>
      user ? { id: user.id, fullName: user.user?.fullName } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Inventory Movement ID ${entityId} (Product ID: ${entity.productId}, Qty: ${entity.quantity}, Type: ${entity.movementType}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'InventoryMovementSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'InventoryMovementSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<InventoryMovement>) {
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
      notes: `Deletion of Inventory Movement ID ${entityId} (Product ID: ${entity?.productId}, Qty: ${entity?.quantity}) from Store ID ${entity?.storeId}`,
    });
    this.logger.log(
      `Audit: ${entityName} deleted with ID ${entityId}`,
      'InventoryMovementSubscriber',
    );
  }
}
