import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InventoryMovementItem } from 'src/entities/inventory-movement-item.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { AuditLogService } from '../audit-log.service';
import { RequestContextService } from 'src/common/context/request-context.service';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class InventoryMovementItemSubscriber
  implements EntitySubscriberInterface<InventoryMovementItem>
{
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return InventoryMovementItem;
  }

  async afterInsert(event: InsertEvent<InventoryMovementItem>) {
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
      notes: `Creation of inventory movement item with ID ${entityId} for Movement ID ${entity.inventoryMovementId} (Product ID: ${entity.productId}, Qty: ${entity.quantity})`,
    });
    this.logger.log(
      `Audit: ${entityName} created with ID ${entityId}`,
      'InventoryMovementItemSubscriber',
    );
  }

  async beforeUpdate(event: UpdateEvent<InventoryMovementItem>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(InventoryMovementItem).findOne({
      where: { id: databaseEntity.id },
      relations: ['inventoryMovement', 'product'], // Load relations for detailed notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<InventoryMovementItem>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as InventoryMovementItem;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'InventoryMovementItemSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<InventoryMovementItem>(
      entityName,
      entityId,
      oldValue,
      entity as InventoryMovementItem,
    );

    // Compare fields
    changeTracker.compareField('quantity', 'Quantity');
    changeTracker.compareField('unit_cost', 'Unit Cost');

    // Audit relations
    changeTracker.compareRelation('inventoryMovement', 'Inventory Movement', (movement) =>
      movement ? { id: movement.id, movementType: movement.movementType } : null,
    );
    changeTracker.compareRelation('product', 'Product', (product) =>
      product ? { id: product.id, name: product.name } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Inventory Movement Item ID ${entityId} (Product ID: ${entity.productId}, Qty: ${entity.quantity}, Movement ID: ${entity.inventoryMovementId}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

      // // Get storeId from InventoryMovement
      // const associatedMovement = await event.manager
      //   .getRepository('InventoryMovement')
      //   .findOne({ where: { id: entity.inventoryMovementId }, select: ['storeId'] });
      // const effectiveStoreId = associatedMovement?.storeId || storeId; // Fallback to context storeId if not found

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
        'InventoryMovementItemSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'InventoryMovementItemSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<InventoryMovementItem>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    // // Get storeId from InventoryMovement
    // const associatedMovement = await event.manager
    //   .getRepository('InventoryMovement')
    //   .findOne({ where: { id: entity.inventoryMovementId }, select: ['storeId'] });
    // const effectiveStoreId = associatedMovement?.storeId || storeId; // Fallback to context storeId if not found

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
      notes: `Deletion of inventory movement item with ID ${entityId} (Product ID: ${entity?.productId}, Qty: ${entity?.quantity}, Movement ID: ${entity?.inventoryMovementId})`,
    });
    this.logger.log(
      `Audit: ${entityName} deleted with ID ${entityId}`,
      'InventoryMovementItemSubscriber',
    );
  }
}
