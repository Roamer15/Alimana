import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { StoreSetting, StoreSettingType } from 'src/entities/store-setting.entity';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';

@Injectable()
export class StoreSettingService {
  constructor(
    @InjectRepository(StoreSetting)
    private storeSettingRepository: Repository<StoreSetting>,
    private readonly requestContextService: RequestContextService,
    private readonly logger: MyLoggerService,
  ) {}

  async findAllSettings(storeId: number): Promise<StoreSetting[]> {
    const { storeId: contextStoreId } = this.requestContextService.getContext();

    if (!contextStoreId) {
      throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);
    }

    // Vérification supplémentaire pour s'assurer que l'utilisateur est bien dans la bonne boutique
    if (contextStoreId !== storeId) {
      throwHttpError(ErrorCode.FORBIDDEN, {
        raeson: 'Accès refusé. Vous ne pouvez voir les paramètres que de votre boutique actuelle.',
      });
    }
    const settings = await this.storeSettingRepository.find({
      where: { store: { id: storeId } },
      relations: ['createdBy', 'updatedBy'],
    });

    // await this.auditLogsService.createAuditLog({
    //   storeId: storeId,
    //   storeUserId: storeUserId,
    //   actionType: AuditActionType.VIEW,
    //   entity: 'StoreSetting',
    //   entityId: String(storeId), // ID de la boutique
    //   notes: `Consultation des paramètres de la boutique (ID: ${storeId}) par l'utilisateur (StoreUser ID: ${storeUserId}).`,
    //   ipAddress,
    //   userAgent,
    // });

    return settings;
  }

  async updateSetting(storeId: number, key: string, newValue: string): Promise<StoreSetting> {
    const { storeId: contextStoreId, storeUserId: updatedById } =
      this.requestContextService.getContext();

    if (!contextStoreId || !updatedById) {
      throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);
    }

    // Vérification supplémentaire pour s'assurer que l'utilisateur est bien dans la bonne boutique
    if (contextStoreId !== storeId) {
      throwHttpError(ErrorCode.FORBIDDEN, {
        raeson:
          'Accès refusé. Vous ne pouvez modifier les parametre que de votre boutique actuelle.',
      });
    }

    const setting = await this.storeSettingRepository.findOne({
      where: { store: { id: storeId }, key },
      relations: ['updatedBy', 'createdBy'], // Inclure pour l'audit si nécessaire
    });

    if (!setting) {
      throw new NotFoundException(
        `Paramètre "${key}" non trouvé pour la boutique (ID: ${storeId}).`,
      );
    }

    if (!setting.isEditable) {
      throw new ForbiddenException(`Le paramètre "${key}" n'est pas modifiable.`);
    }

    // Valider le type de données si nécessaire
    let parsedValue: any;
    switch (setting.type) {
      case StoreSettingType.BOOLEAN:
        if (newValue !== 'true' && newValue !== 'false')
          throw new BadRequestException(`La valeur pour "${key}" doit être 'true' ou 'false'.`);
        parsedValue = newValue === 'true';
        break;
      case StoreSettingType.NUMBER:
        if (isNaN(Number(newValue)))
          throw new BadRequestException(`La valeur pour "${key}" doit être un nombre.`);
        parsedValue = Number(newValue);
        break;
      default: // STRING
        parsedValue = newValue;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    setting.value = parsedValue.toString(); // Assurez-vous de stocker la valeur comme string
    setting.updatedAt = new Date();
    setting.updatedById = updatedById; // L'ID du StoreUser qui a modifié

    const updatedSetting = await this.storeSettingRepository.save(setting);

    // await this.auditLogsService.createAuditLog({
    //   storeId: storeId,
    //   storeUserId: updatedById,
    //   actionType: AuditActionType.UPDATE,
    //   entity: 'StoreSetting',
    //   entityId: String(setting.id),
    //   oldValue: { key: setting.key, value: oldValue },
    //   newValue: { key: setting.key, value: updatedSetting.value },
    //   notes: `Paramètre "${setting.key}" de la boutique (ID: ${storeId}) mis à jour de "${oldValue}" à "${updatedSetting.value}" par l'utilisateur (StoreUser ID: ${updatedById}).`,
    //   ipAddress: this.requestContextService.getContext().ipAddress,
    //   userAgent: this.requestContextService.getContext().userAgent,
    // });

    this.logger.log(
      `Setting ${key} for store ${storeId} updated by store user ${updatedById}.`,
      'StoreSettingService',
    );

    return updatedSetting;
  }
}
