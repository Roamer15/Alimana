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
import { UserRefreshToken } from 'src/entities/user-refresh-token.entity';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class UserRefreshTokenSubscriber implements EntitySubscriberInterface<UserRefreshToken> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return UserRefreshToken;
  }

  async afterInsert(event: InsertEvent<UserRefreshToken>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    await this.auditLogsService.createAuditLog({
      storeId, // storeId from context
      storeUserId,
      actionType: AuditActionType.CREATE,
      entity: entityName,
      entityId: entityId,
      newValue: JSON.parse(JSON.stringify(entity)) as object,
      ipAddress,
      userAgent,
      notes: `New Refresh Token generated for User ID ${entity.userId} (Token ID: ${entityId}).`,
    });
    this.logger.log(
      `Audit: ${entityName} created with ID ${entityId} for User ID ${entity.userId}`,
      'UserRefreshTokenSubscriber',
    );
  }

  async beforeUpdate(event: UpdateEvent<UserRefreshToken>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'unknown');

    const loadedOldValue = await event.manager.getRepository(UserRefreshToken).findOne({
      where: { id: databaseEntity.id },
      relations: ['user', 'storeUser'], // Load relations if you want to audit user/storeUser details
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  async afterUpdate(event: UpdateEvent<UserRefreshToken>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as UserRefreshToken;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Could not compare values for ${entityName} ID ${entityId}.`,
        'UserRefreshTokenSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<UserRefreshToken>(
      entityName,
      entityId,
      oldValue,
      entity as UserRefreshToken,
    );

    changeTracker.compareField('userAgent', 'User Agent');
    changeTracker.compareField('ipAddress', 'IP Address');
    changeTracker.compareField('expiresAt', 'Expires At');

    const revokedChanged = changeTracker.compareField('revoked', 'Revoked Status');
    if (revokedChanged && entity.revoked === true) {
      changeTracker.addNote(`Refresh Token for User ID ${entity.userId} has been revoked.`);
    }

    changeTracker.compareField('userId', 'User ID');
    changeTracker.compareField('storeUserId', 'Store User ID');

    if (changeTracker.hasChanges()) {
      const notes = `Refresh Token ID ${entityId} for User ID ${entity.userId} updated by StoreUser ID ${storeUserId}. Details: ${changeTracker.getNotes()}.`;

      await this.auditLogsService.createAuditLog(
        changeTracker.getAuditLogPayload({
          storeId,
          storeUserId,
          actionType: AuditActionType.UPDATE,
          ipAddress,
          userAgent,
          notes: notes,
        }),
      );

      this.logger.log(
        `Audit: ${entityName} updated with ID ${entityId}. Fields changed: ${changeTracker.getChangedFields().join(', ')}`,
        'UserRefreshTokenSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} updated but no significant changes detected.`,
        'UserRefreshTokenSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  async afterRemove(event: RemoveEvent<UserRefreshToken>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'unknown');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    await this.auditLogsService.createAuditLog({
      storeId,
      storeUserId,
      actionType: AuditActionType.DELETE,
      entity: entityName,
      entityId: entityId,
      oldValue: JSON.parse(JSON.stringify(entity)) as object,
      newValue: null,
      ipAddress,
      userAgent,
      notes: `Deletion of Refresh Token ID ${entityId} for User ID ${entity?.userId}.`,
    });
    this.logger.log(
      `Audit: ${entityName} deleted with ID ${entityId}`,
      'UserRefreshTokenSubscriber',
    );
  }
}
