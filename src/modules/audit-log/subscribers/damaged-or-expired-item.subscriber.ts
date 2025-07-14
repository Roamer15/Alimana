import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { DamagedOrExpiredItem } from 'src/entities/damaged-or-expired-item.entity';
import { AuditLogService } from '../audit-log.service';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextService } from 'src/common/context/request-context.service';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class DamagedOrExpiredItemSubscriber
  implements EntitySubscriberInterface<DamagedOrExpiredItem>
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
    return DamagedOrExpiredItem;
  }

  async afterInsert(event: InsertEvent<DamagedOrExpiredItem>) {
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
      notes: `Creation of damaged/expired item with ID ${entityId} for Report ID ${entity.reportId} (Product ID: ${entity.productId}, Qty: ${entity.quantity})`,
    });
    this.logger.log(
      `Audit: ${entityName} created with ID ${entityId}`,
      'DamagedOrExpiredItemSubscriber',
    );
  }

  async beforeUpdate(event: UpdateEvent<DamagedOrExpiredItem>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(DamagedOrExpiredItem).findOne({
      where: { id: databaseEntity.id },
      relations: ['report', 'product'], // Load relations for detailed notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<DamagedOrExpiredItem>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as DamagedOrExpiredItem;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'DamagedOrExpiredItemSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<DamagedOrExpiredItem>(
      entityName,
      entityId,
      oldValue,
      entity as DamagedOrExpiredItem,
    );

    // Compare fields
    changeTracker.compareField('quantity', 'Quantity');
    changeTracker.compareField('notes', 'Notes');

    // Audit relations
    changeTracker.compareRelation('report', 'Damaged/Expired Report', (report) =>
      report ? { id: report.id } : null,
    );
    changeTracker.compareRelation('product', 'Product', (product) =>
      product ? { id: product.id, name: product.name } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Damaged/Expired Item ID ${entityId} (Product ID: ${entity.productId}, Report ID: ${entity.reportId}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'DamagedOrExpiredItemSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'DamagedOrExpiredItemSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<DamagedOrExpiredItem>) {
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
      notes: `Deletion of damaged/expired item with ID ${entityId} (Product ID: ${entity?.productId}, Report ID: ${entity?.reportId})`,
    });
    this.logger.log(
      `Audit: ${entityName} deleted with ID ${entityId}`,
      'DamagedOrExpiredItemSubscriber',
    );
  }
}
