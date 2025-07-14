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
import {
  DamagedOrExpiredReport,
  ReportStatus,
} from 'src/entities/damaged-or-expired-report.entity';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class DamagedOrExpiredReportSubscriber
  implements EntitySubscriberInterface<DamagedOrExpiredReport>
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
    return DamagedOrExpiredReport;
  }

  async afterInsert(event: InsertEvent<DamagedOrExpiredReport>) {
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
      notes: `Creation of damaged/expired report with ID ${entityId} (Reason: ${entity.reason}) for Store ID ${entity.storeId}`,
    });
    this.logger.log(
      `Audit: ${entityName} created with ID ${entityId}`,
      'DamagedOrExpiredReportSubscriber',
    );
  }

  async beforeUpdate(event: UpdateEvent<DamagedOrExpiredReport>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(DamagedOrExpiredReport).findOne({
      where: { id: databaseEntity.id },
      relations: ['store', 'reportedBy', 'approvedBy'], // Load relations for detailed notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<DamagedOrExpiredReport>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as DamagedOrExpiredReport;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'DamagedOrExpiredReportSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<DamagedOrExpiredReport>(
      entityName,
      entityId,
      oldValue,
      entity as DamagedOrExpiredReport,
    );

    // Compare fields
    changeTracker.compareField('reason', 'Reason');
    changeTracker.compareField('notes', 'Notes');
    changeTracker.compareField('approvedAt', 'Approved At');

    const statusChanged = changeTracker.compareField('status', 'Status');
    if (statusChanged) {
      changeTracker.addNote(
        `Report ID ${entityId} status changed from ${oldValue.status} to ${entity.status}.`,
      );
      if (entity.status === ReportStatus.APPROVED) {
        changeTracker.addNote(`Report ID ${entityId} was approved.`);
      } else if (entity.status === ReportStatus.REJECTED) {
        changeTracker.addNote(`Report ID ${entityId} was rejected.`);
      }
    }

    // Audit relations
    changeTracker.compareRelation('store', 'Store', (store) =>
      store ? { id: store.id, name: store.name } : null,
    );
    changeTracker.compareRelation('reportedBy', 'Reported By (StoreUser)', (user) =>
      user ? { id: user.id, fullName: user.user?.fullName } : null,
    );
    changeTracker.compareRelation('approvedBy', 'Approved By (StoreUser)', (user) =>
      user ? { id: user.id, fullName: user.user?.fullName } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Damaged/Expired Report ID ${entityId} (Status: ${entity.status}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'DamagedOrExpiredReportSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'DamagedOrExpiredReportSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<DamagedOrExpiredReport>) {
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
      notes: `Deletion of damaged/expired report with ID ${entityId} (Reason: ${entity?.reason}) from Store ID ${entity?.storeId}`,
    });
    this.logger.log(
      `Audit: ${entityName} deleted with ID ${entityId}`,
      'DamagedOrExpiredReportSubscriber',
    );
  }
}
