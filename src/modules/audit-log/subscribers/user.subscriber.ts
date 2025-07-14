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
import { User } from 'src/entities/User.entity';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  /**
   * Appelé après l'insertion d'un nouvel utilisateur.
   * Enregistre un log d'audit de type CREATE.
   */
  async afterInsert(event: InsertEvent<User>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'inconnu'); // Utilisation de nullish coalescing

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    await this.auditLogsService.createAuditLog({
      storeId,
      storeUserId, //storeUserId sera null a la creation de l'utilisateur
      actionType: AuditActionType.CREATE,
      entity: entityName,
      entityId: entityId,
      newValue: JSON.parse(JSON.stringify(entity)) as object,
      ipAddress,
      userAgent,
      notes: `Création de l'utilisateur avec ID ${entityId}: ${entity.fullName} (${entity.email})`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'UserSubscriber');
  }

  /**
   * Appelé avant la mise à jour d'un utilisateur.
   * Stocke l'ancienne valeur de l'entité dans le RequestContextService.
   */
  async beforeUpdate(event: UpdateEvent<User>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'inconnu');

    const loadedOldValue = await event.manager.getRepository(User).findOne({
      where: { id: databaseEntity.id },
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  /**
   * Appelé après la mise à jour d'un utilisateur.
   * Détecte les changements via `updatedColumns` et `JSON.stringify` pour une précision maximale.
   */
  async afterUpdate(event: UpdateEvent<User>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'inconnu');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as User;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Impossible de comparer les valeurs pour ${entityName} ID ${entityId}.`,
        'UserSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<User>(
      entityName,
      entityId,
      oldValue,
      entity as User,
    );

    // Comparaison des champs pertinents
    changeTracker.compareField('email', 'Email');
    changeTracker.compareField('fullName', 'Nom complet');
    changeTracker.compareField('phone', 'Téléphone');
    changeTracker.compareField('avatarUrl', 'URL Avatar');
    changeTracker.compareField('isActive', 'Statut Actif');
    changeTracker.compareField('authProvider', 'Fournisseur Auth');
    changeTracker.compareField('canCreateStore', 'Peut créer magasin');

    if (changeTracker.hasChanges()) {
      const notes = `Mise à jour de l'utilisateur ID ${entityId} (${entity.email}) par l'utilisateur ID ${storeUserId}. Détails: ${changeTracker.getNotes()}.`;

      await this.auditLogsService.createAuditLog(
        changeTracker.getAuditLogPayload({
          storeId,
          storeUserId: storeUserId ?? 0,
          actionType: AuditActionType.UPDATE,
          ipAddress: ipAddress ?? undefined,
          userAgent: userAgent ?? undefined,
          notes: notes,
        }),
      );

      this.logger.log(
        `Audit: ${entityName} updated with ID ${entityId}. Champs modifiés: ${changeTracker.getChangedFields().join(', ')}`,
        'UserSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} mis à jour mais aucune modification significative détectée.`,
        'UserSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  /**
   * Appelé après la suppression d'un utilisateur.
   * Enregistre un log d'audit de type DELETE.
   */
  async afterRemove(event: RemoveEvent<User>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'inconnu');

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
      notes: `Suppression de l'utilisateur avec ID ${entityId}: ${entity?.fullName} (${entity?.email})`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'UserSubscriber');
  }
}
