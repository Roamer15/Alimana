import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import {
  CashRegisterSession,
  CashRegisterSessionStatus,
} from 'src/entities/cash-register-session.entity';
import { AuditLogService } from '../audit-log.service';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { RequestContextService } from 'src/common/context/request-context.service';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class CashRegisterSessionSubscriber
  implements EntitySubscriberInterface<CashRegisterSession>
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
    return CashRegisterSession;
  }

  async afterInsert(event: InsertEvent<CashRegisterSession>) {
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
      notes: `Cash Register Session with ID ${entityId} opened by User ID ${entity.storeUserId} for Store ID ${entity.storeId} (Initial Cash: ${entity.initialCash})`,
    });
    this.logger.log(
      `Audit: ${entityName} created with ID ${entityId}`,
      'CashRegisterSessionSubscriber',
    );
  }

  async beforeUpdate(event: UpdateEvent<CashRegisterSession>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(CashRegisterSession).findOne({
      where: { id: databaseEntity.id },
      relations: ['store', 'createdBy', 'cashRegister'], // Load relations for detailed notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<CashRegisterSession>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as CashRegisterSession;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'CashRegisterSessionSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<CashRegisterSession>(
      entityName,
      entityId,
      oldValue,
      entity as CashRegisterSession,
    );

    // Compare fields
    changeTracker.compareField('openedAt', 'Opened At');
    changeTracker.compareField('closedAt', 'Closed At');
    changeTracker.compareField('initialCash', 'Initial Cash');
    changeTracker.compareField('closingCash', 'Closing Cash');
    changeTracker.compareField('systemCashTotal', 'System Cash Total');
    changeTracker.compareField('notes', 'Notes');

    const statusChanged = changeTracker.compareField('status', 'Status');
    if (statusChanged && entity.status === CashRegisterSessionStatus.CLOSED) {
      changeTracker.addNote(`Cash Register Session ID ${entityId} was closed.`);
    } else if (statusChanged && entity.status === CashRegisterSessionStatus.ARCHIVED) {
      changeTracker.addNote(`Cash Register Session ID ${entityId} was archived.`);
    }

    // Audit relations
    changeTracker.compareRelation('store', 'Store', (store) =>
      store ? { id: store.id, name: store.name } : null,
    );
    changeTracker.compareRelation('createdBy', 'Created By (StoreUser)', (user) =>
      user ? { id: user.id, fullName: user.user?.fullName } : null,
    );
    changeTracker.compareRelation('cashRegister', 'Cash Register', (register) =>
      register ? { id: register.id, name: register.name } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Cash Register Session ID ${entityId} (Status: ${entity.status}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'CashRegisterSessionSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'CashRegisterSessionSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<CashRegisterSession>) {
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
      notes: `Deletion of Cash Register Session ID ${entityId} (Store ID: ${entity?.storeId})`,
    });
    this.logger.log(
      `Audit: ${entityName} deleted with ID ${entityId}`,
      'CashRegisterSessionSubscriber',
    );
  }
}
