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
import { Payment } from 'src/entities/payment.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextService } from 'src/common/context/request-context.service';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class PaymentSubscriber implements EntitySubscriberInterface<Payment> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Payment;
  }

  async afterInsert(event: InsertEvent<Payment>) {
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
      notes: `Creation of payment with ID ${entityId} for Sale ID ${entity.saleId} (Amount: ${entity.amount}, Method: ${entity.paymentMethodId})`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'PaymentSubscriber');
  }

  async beforeUpdate(event: UpdateEvent<Payment>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(Payment).findOne({
      where: { id: databaseEntity.id },
      relations: ['sale', 'paymentMethod'],
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<Payment>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as Payment;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'PaymentSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<Payment>(
      entityName,
      entityId,
      oldValue,
      entity as Payment,
    );

    // Compare fields
    changeTracker.compareField('amount', 'Amount');
    changeTracker.compareField('transactionReference', 'Transaction Reference');
    changeTracker.compareField('status', 'Status');

    // Audit relations
    changeTracker.compareRelation('sale', 'Sale', (sale) => (sale ? { id: sale.id } : null));
    changeTracker.compareRelation('paymentMethod', 'Payment Method', (method) =>
      method ? { id: method.id, name: method.name } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Payment ID ${entityId} (Amount: ${entity.amount}, Sale ID: ${entity.saleId}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'PaymentSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'PaymentSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<Payment>) {
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
      notes: `Deletion of payment with ID ${entityId} for Sale ID ${entity?.saleId} (Amount: ${entity?.amount})`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'PaymentSubscriber');
  }
}
