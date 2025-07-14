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
import { AuditLogService } from '../audit-log.service';
import { StoreUser, StoreUserStatus } from 'src/entities/store-user.entity';
import { AuditActionType } from 'src/entities/audit-logs.entity';
import { EntityChangeTracker } from 'src/shared/utils/entity-change-tracker.util';

@Injectable()
@EventSubscriber()
export class StoreUserSubscriber implements EntitySubscriberInterface<StoreUser> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return StoreUser;
  }

  /**
   * Appelé après l'insertion d'une nouvelle association StoreUser.
   * Enregistre un log d'audit de type CREATE.
   */
  async afterInsert(event: InsertEvent<StoreUser>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity.id);

    const { storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    await this.auditLogsService.createAuditLog({
      storeId: entity.storeId, // Le magasin concerné par cette association StoreUser
      storeUserId: storeUserId, // L'utilisateur StoreUser qui a initié l'action
      actionType: AuditActionType.CREATE,
      entity: entityName,
      entityId: entityId,
      newValue: JSON.parse(JSON.stringify(entity)) as object,
      ipAddress,
      userAgent,
      notes: `Association StoreUser créée (StoreUser ID ${entityId}) pour User ID ${entity.userId} dans Store ID ${entity.storeId}. Statut: ${entity.status}`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'StoreUserSubscriber');
  }

  /**
   * Appelé avant la mise à jour d'une association StoreUser.
   * Stocke l'ancienne valeur de l'entité dans le RequestContextService.
   */
  async beforeUpdate(event: UpdateEvent<StoreUser>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity.id);

    // Charger l'ancienne valeur avec la relation 'role' si vous voulez auditer les changements de rôle
    const loadedOldValue = await event.manager.getRepository(StoreUser).findOne({
      where: { id: databaseEntity.id },
      relations: ['role'],
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  /**
   * Appelé après la mise à jour d'une association StoreUser.
   * Enregistre un log d'audit de type UPDATE,
   */

  async afterUpdate(event: UpdateEvent<StoreUser>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'inconnu');

    const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as StoreUser;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Impossible de comparer les valeurs pour ${entityName} ID ${entityId}.`,
        'StoreUserSubscriber',
      );
      return;
    }

    const changeTracker = new EntityChangeTracker<StoreUser>(
      entityName,
      entityId,
      oldValue,
      entity as StoreUser,
    );

    // Comparaison des champs ID directs (user, store)
    changeTracker.compareField('userId', 'ID Utilisateur');
    changeTracker.compareField('storeId', 'ID Magasin');

    // Comparaison de la relation de rôle par son ID et son nom
    const roleChanged = changeTracker.compareRelation(
      'role',
      'Rôle',
      (role) => (role ? { id: role.id, name: role.name } : null), // Extrait l'ID et le nom du rôle
    );
    if (roleChanged) {
      const oldRoleName = oldValue.role ? oldValue.role.name : 'null';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const newRoleName = entity.role ? entity.role.name : 'null';
      changeTracker.addNote(
        `Rôle changé de "${oldRoleName}" (ID ${oldValue.roleId}) à "${newRoleName}" (ID ${entity.roleId}).`,
      );
    }

    // Comparaison du statut avec logique spécifique
    const statusChanged = changeTracker.compareField('status', 'Statut');
    if (statusChanged) {
      if (oldValue.status === StoreUserStatus.PENDING && entity.status === StoreUserStatus.ACTIVE) {
        changeTracker.addNote(`Utilisateur activé dans le magasin.`);
      } else if (
        oldValue.status === StoreUserStatus.ACTIVE &&
        entity.status === StoreUserStatus.SUSPENDED
      ) {
        changeTracker.addNote(`Utilisateur suspendu du magasin.`);
      }
    }

    // Comparaison de la date de jointure
    changeTracker.compareField('joinedAt', 'Date de jointure');

    if (changeTracker.hasChanges()) {
      const notes = `Mise à jour de l'association StoreUser ID ${entityId} (User ID ${entity.userId} dans Store ID ${entity.storeId}) par l'utilisateur ID ${storeUserId}. Détails: ${changeTracker.getNotes()}.`;

      await this.auditLogsService.createAuditLog(
        changeTracker.getAuditLogPayload({
          storeId: storeId, // ID du magasin concerné
          storeUserId,
          actionType: AuditActionType.UPDATE,
          ipAddress: ipAddress ?? undefined,
          userAgent,
          notes: notes,
        }),
      );

      this.logger.log(
        `Audit: ${entityName} updated with ID ${entityId}. Champs modifiés: ${changeTracker.getChangedFields().join(', ')}`,
        'StoreUserSubscriber',
      );
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} mis à jour mais aucune modification significative détectée.`,
        'StoreUserSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  /**
   * Appelé après la suppression d'une association StoreUser.
   * Enregistre un log d'audit de type DELETE.
   */
  async afterRemove(event: RemoveEvent<StoreUser>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id);

    const { storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    await this.auditLogsService.createAuditLog({
      storeId: entity?.storeId ?? null, // Le magasin concerné
      storeUserId: storeUserId,
      actionType: AuditActionType.DELETE,
      entity: entityName,
      entityId: entityId,
      oldValue: JSON.parse(JSON.stringify(entity)) as object,
      newValue: null,
      ipAddress,
      userAgent,
      notes: `Suppression de l'association StoreUser ID ${entityId} (User ID ${entity?.userId} de Store ID ${entity?.storeId}).`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'StoreUserSubscriber');
  }
}
