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
import { Sale } from 'src/entities/sale.entity';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class SaleSubscriber implements EntitySubscriberInterface<Sale> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Sale;
  }

  async afterInsert(event: InsertEvent<Sale>) {
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
      notes: `Creation of sale with ID ${entityId} (Total: ${entity.totalAmount}) for Store ID ${entity.storeId}`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'SaleSubscriber');
  }

  async beforeUpdate(event: UpdateEvent<Sale>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    // Load relations if you need to audit their names/details
    const loadedOldValue = await event.manager.getRepository(Sale).findOne({
      where: { id: databaseEntity.id },
      relations: ['store', 'createdBy', 'cashRegisterSession'],
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<Sale>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as Sale;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'SaleSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<Sale>(
      entityName,
      entityId,
      oldValue,
      entity as Sale,
    );

    // Compare fields
    changeTracker.compareField('totalAmount', 'Total Amount');
    changeTracker.compareField('discount', 'Discount');
    const isRefundedChanged = changeTracker.compareField('isRefunded', 'Is Refunded');

    if (isRefundedChanged && entity.isRefunded) {
      changeTracker.addNote(`Sale ID ${entityId} was marked as refunded.`);
    }

    // Audit relations
    changeTracker.compareRelation('store', 'Store', (store) =>
      store ? { id: store.id, name: store.name } : null,
    );
    changeTracker.compareRelation('createdBy', 'Created By', (user) =>
      user ? { id: user.id, fullName: user.user?.fullName } : null,
    );
    changeTracker.compareRelation('cashRegisterSession', 'Cash Register Session', (session) =>
      session ? { id: session.id, status: session.status } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Sale ID ${entityId} (Total: ${entity.totalAmount}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'SaleSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'SaleSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<Sale>) {
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
      notes: `Deletion of sale with ID ${entityId} (Total: ${entity?.totalAmount}) from Store ID ${entity?.storeId}`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'SaleSubscriber');
  }
}
