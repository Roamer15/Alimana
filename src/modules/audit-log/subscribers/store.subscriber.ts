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
import { Store } from 'src/entities/store.entity';
import { AuditActionType } from 'src/entities/audit-logs.entity';

@Injectable()
@EventSubscriber()
export class StoreSubscriber implements EntitySubscriberInterface<Store> {
  constructor(
    dataSource: DataSource,
    private readonly auditLogsService: AuditLogService,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Store;
  }

  /**
   * Appelé après l'insertion d'un nouveau magasin.
   * Enregistre un log d'audit de type CREATE.
   */
  async afterInsert(event: InsertEvent<Store>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'inconnu');

    const { userId, ipAddress, userAgent } = this.requestContextService.getContext();
    //  À la création, l'utilisateur n'a pas encore de storeUserId.
    // On log donc l'action avec son userId global.
    await this.auditLogsService.createAuditLog({
      storeId: entity.id, // Pour la création d'un magasin, le storeId est l'ID du magasin lui-même
      storeUserId: userId,
      actionType: AuditActionType.CREATE,
      entity: entityName,
      entityId: entityId,
      newValue: JSON.parse(JSON.stringify(entity)) as object,
      ipAddress,
      userAgent,
      notes: `Création du magasin avec ID ${entityId}: ${entity.name}`,
    });
    this.logger.log(`Audit: ${entityName} created with ID ${entityId}`, 'StoreSubscriber');
  }

  /**
   * Appelé avant la mise à jour d'un magasin.
   * Stocke l'ancienne valeur de l'entité dans le RequestContextService.
   */
  async beforeUpdate(event: UpdateEvent<Store>) {
    const { databaseEntity } = event;
    const entityId = String(databaseEntity?.id ?? 'inconnu');

    const loadedOldValue = await event.manager.getRepository(Store).findOne({
      where: { id: databaseEntity.id },
    });

    this.requestContextService.setOldValue(
      entityId,
      loadedOldValue ? JSON.parse(JSON.stringify(loadedOldValue)) : null,
    );
  }

  /**
   * Appelé après la mise à jour d'un magasin.
   * Détecte les changements via `updatedColumns` et `JSON.stringify`.
   */
  async afterUpdate(event: UpdateEvent<Store>) {
    const { entity, metadata, updatedColumns } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'inconnu');

    const { storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
    const oldValue = this.requestContextService.getOldValue(entityId) as Store;

    if (!oldValue || !entity) {
      this.logger.warn(
        `Audit: Impossible de comparer les valeurs pour ${entityName} ID ${entityId}.`,
        'StoreSubscriber',
      );
      return;
    }

    const ignoredColumns = ['createdAt', 'updatedAt'];

    const oldValuesLogged: Record<string, any> = {};
    const newValuesLogged: Record<string, any> = {};
    const actualChangedFields: string[] = [];

    for (const column of updatedColumns) {
      const fieldName = column.propertyName;

      if (ignoredColumns.includes(fieldName)) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const oldVal = (oldValue as any)[fieldName];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const newVal = (entity as any)[fieldName];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        oldValuesLogged[fieldName] = oldVal as object;
        newValuesLogged[fieldName] = newVal as object;
        actualChangedFields.push(fieldName);
      }
    }

    if (actualChangedFields.length > 0) {
      const notes = `Mise à jour du magasin ID ${entityId} (${entity.name}) par l'utilisateur ID ${storeUserId}. Champs modifiés: ${actualChangedFields.join(', ')}.`;

      await this.auditLogsService.createAuditLog({
        storeId: entity.id as number,
        storeUserId,
        actionType: AuditActionType.UPDATE,
        entity: entityName,
        entityId: entityId,
        oldValue: oldValuesLogged,
        newValue: newValuesLogged,
        ipAddress,
        userAgent,
        notes: notes,
      });
      this.logger.log(`Audit: ${entityName} updated with ID ${entityId}`, 'StoreSubscriber');
    } else {
      this.logger.verbose(
        `Audit: ${entityName} ID ${entityId} mis à jour sans modification détectée (champs ignorés: ${ignoredColumns.join(', ')})`,
        'StoreSubscriber',
      );
    }

    this.requestContextService.clearOldValue(entityId);
  }

  /**
   * Appelé après la suppression d'un magasin.
   * Enregistre un log d'audit de type DELETE.
   */
  async afterRemove(event: RemoveEvent<Store>) {
    const { entity, metadata } = event;
    const entityName = metadata.name;
    const entityId = String(entity?.id ?? 'inconnu');

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
      notes: `Suppression du magasin avec ID ${entityId}: ${entity?.name}`,
    });
    this.logger.log(`Audit: ${entityName} deleted with ID ${entityId}`, 'StoreSubscriber');
  }
}
