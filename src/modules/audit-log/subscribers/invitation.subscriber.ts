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
import { RequestContextService } from 'src/common/context/request-context.service';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { Invitation, InvitationStatus } from 'src/entities/invitation.entity';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class InvitationSubscriber implements EntitySubscriberInterface<Invitation> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Invitation;
  }

  async afterInsert(event: InsertEvent<Invitation>) {
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
      notes: `Invitation created with ID ${entityId} for ${entity.email} to Store ID ${entity.storeId} with Role ID ${entity.roleId}`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'InvitationSubscriber');
  }

  async beforeUpdate(event: UpdateEvent<Invitation>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(Invitation).findOne({
      where: { id: databaseEntity.id },
      relations: ['store', 'role', 'invitedBy , invitedBy.user'], // Load relations for better notes
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<Invitation>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as Invitation;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'InvitationSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<Invitation>(
      entityName,
      entityId,
      oldValue,
      entity as Invitation,
    );

    // Compare fields
    changeTracker.compareField('email', 'Email');
    changeTracker.compareField('expiresAt', 'Expires At');
    changeTracker.compareField('acceptedAt', 'Accepted At');

    const statusChanged = changeTracker.compareField('status', 'Status');
    if (statusChanged) {
      if (
        oldValue.status === InvitationStatus.PENDING &&
        entity.status === InvitationStatus.ACCEPTED
      ) {
        changeTracker.addNote(`Invitation for ${entity.email} has been accepted.`);
      } else if (
        oldValue.status === InvitationStatus.PENDING &&
        entity.status === InvitationStatus.CANCELLED
      ) {
        changeTracker.addNote(`Invitation for ${entity.email} has been cancelled.`);
      } else if (
        oldValue.status === InvitationStatus.PENDING &&
        entity.status === InvitationStatus.EXPIRED
      ) {
        changeTracker.addNote(`Invitation for ${entity.email} has expired.`);
      }
    }

    // Audit relations
    changeTracker.compareRelation('store', 'Store', (store) =>
      store ? { id: store.id, name: store.name } : null,
    );
    changeTracker.compareRelation('role', 'Role', (role) =>
      role ? { id: role.id, name: role.name } : null,
    );
    changeTracker.compareRelation('invitedBy', 'Invited By', (user) =>
      user ? { id: user.id, fullName: user.user?.fullName } : null,
    );

    if (changeTracker.hasChanges()) {
      const notes = `Invitation ID ${entityId} (${entity.email}) updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

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
        'InvitationSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'InvitationSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<Invitation>) {
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
      notes: `Deletion of invitation with ID ${entityId} for ${entity?.email} from Store ID ${entity?.storeId}`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'InvitationSubscriber');
  }
}
