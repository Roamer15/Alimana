import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextService } from 'src/common/context/request-context.service';
import { Receipt } from 'src/entities/sale-receipt.entity';
import { AuditLogService } from '../audit-log.service';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class ReceiptSubscriber implements EntitySubscriberInterface<Receipt> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Receipt;
  }

  async afterInsert(event: InsertEvent<Receipt>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    // // For Receipt, we need the storeId from the associated Sale
    // const associatedSale = await event.manager
    //   .getRepository('Sale')
    //   .findOne({ where: { id: entity.saleId }, select: ['storeId'] });
    // const effectiveStoreId = associatedSale?.storeId || storeId;

    await this.auditLogsService.createAuditLog({
      storeId: storeId,
      storeUserId,
      actionType: AuditActionType.CREATE,
      entity: entityName,
      entityId: entityId,
      newValue: JSON.parse(JSON.stringify(entity)) as object,
      ipAddress,
      userAgent,
      notes: `Creation of receipt with ID ${entityId} for Sale ID ${entity.saleId} (Receipt Number: ${entity.receiptNumber})`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'ReceiptSubscriber');
  }

  async beforeUpdate(event: UpdateEvent<Receipt>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(Receipt).findOne({
      where: { id: databaseEntity.id },
      relations: ['sale'], // Load sale relation for better notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<Receipt>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as Receipt;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'ReceiptSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<Receipt>(
      entityName,
      entityId,
      oldValue,
      entity as Receipt,
    );

    // Compare fields
    changeTracker.compareField('content', 'Content');
    changeTracker.compareField('receiptNumber', 'Receipt Number');
    changeTracker.compareField('generatedAt', 'Generated At');

    // Audit sale relation
    changeTracker.compareRelation('sale', 'Sale', (sale) => (sale ? { id: sale.id } : null));

    if (changeTracker.hasChanges()) {
      const notes = `Receipt ID ${entityId} (Sale ID: ${entity.saleId}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'ReceiptSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'ReceiptSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<Receipt>) {
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
      notes: `Deletion of receipt with ID ${entityId} for Sale ID ${entity?.saleId} (Receipt Number: ${entity?.receiptNumber})`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'ReceiptSubscriber');
  }
}
