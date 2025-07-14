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
import { PaymentMethod } from 'src/entities/payment-method.entity';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class PaymentMethodSubscriber implements EntitySubscriberInterface<PaymentMethod> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return PaymentMethod;
  }

  async afterInsert(event: InsertEvent<PaymentMethod>) {
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
      notes: `Creation of payment method with ID ${entityId}: ${entity.name} for Store ID ${entity.storeId}`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'PaymentMethodSubscriber');
  }

  async beforeUpdate(event: UpdateEvent<PaymentMethod>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(PaymentMethod).findOne({
      where: { id: databaseEntity.id },
      relations: ['store'], // Load store relation for better notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<PaymentMethod>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as PaymentMethod;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'PaymentMethodSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<PaymentMethod>(
      entityName,
      entityId,
      oldValue,
      entity as PaymentMethod,
    );

    // Compare fields
    changeTracker.compareField('name', 'Method Name');
    changeTracker.compareField('isActive', 'Is Active');
    changeTracker.compareField('displayName', 'Display Name');
    changeTracker.compareField('isDefault', 'Is Default');

    // Audit store relation
    changeTracker.compareRelation('store', 'Store', (store) =>
      store ? { id: store.id, name: store.name } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Payment Method ID ${entityId} (${entity.name}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'PaymentMethodSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'PaymentMethodSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<PaymentMethod>) {
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
      notes: `Deletion of payment method with ID ${entityId}: ${entity?.name} from Store ID ${entity?.storeId}`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'PaymentMethodSubscriber');
  }
}
