import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreUser, StoreUserStatus } from '../../entities/store-user.entity';
import { Store } from 'src/entities/store.entity';
import { Role } from 'src/entities/role.entity';
import { StoreSetting } from 'src/entities/store-setting.entity';
import { User } from 'src/entities/User.entity';
import { PaymentMethod } from 'src/entities/payment-method.entity';

import { MyLoggerService } from '../../my-logger/my-logger.service';
import { DataSource, Repository } from 'typeorm';
import { CashRegister } from 'src/entities/cash-register.entity';
import { Permission } from 'src/entities/permission.entity';
// import { AuditLogService } from '../audit-log/audit-log.service';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { getDefaultStoreSettings } from './constants/store-default-settings';

import { CreateStoreDto } from './dto/create-store.dto';
import { AuthService } from '../auth/auth.service';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(StoreUser)
    private storeUserRepository: Repository<StoreUser>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(CashRegister)
    private cashRegisterRepository: Repository<CashRegister>,
    @InjectRepository(StoreSetting)
    private storeSettingRepository: Repository<StoreSetting>,
    private readonly requestContextService: RequestContextService,
    private readonly logger: MyLoggerService,
    private readonly authService: AuthService,
    private dataSource: DataSource, // Injecter DataSource pour les transactions
  ) {}

  // create store

  async createStore(
    createStoreDto: CreateStoreDto,
  ): Promise<{ store: Store; accessToken: string; refreshToken: string }> {
    const { name, description, address, phone, email, logoUrl, profileImageUrl, websiteUrl } =
      createStoreDto;

    const { userId, canCreateStore, email: userEmail } = this.requestContextService.getContext();

    if (!canCreateStore) {
      throwHttpError(ErrorCode.UNAUTHORIZED_TO_CREATE_STORE);
    }
    if (!userId) {
      throw new UnauthorizedException('User ID is missing from context');
    }

    const ownerUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!ownerUser) {
      throw new UnauthorizedException('User is missing from database');
    }

    let newStore: Store;
    let newStoreUser: StoreUser;
    let adminRole: Role;
    let defaultCashRegister: CashRegister;
    let defaultPaymentMethod: PaymentMethod;

    try {
      const result = await this.dataSource.transaction(async (manager) => {
        // 1. Créer la boutique
        newStore = manager.getRepository(Store).create({
          name,
          description,
          address,
          phone,
          email,
          logoUrl,
          websiteUrl,
          profileImageUrl,
          ownerId: userId, // Lier l'utilisateur propriétaire
        });
        await manager.getRepository(Store).save(newStore);
        if (!newStore.id) {
          throw new Error('Failed to generate Store ID during creation.');
        }
        this.logger.log(`Store ${newStore.name} created with ID ${newStore.id}.`, 'StoreService');

        // 2. Trouver toutes les permissions
        const allPermissions = await manager.getRepository(Permission).find();
        // Optionnel: Vérifier si des permissions sont trouvées
        if (!allPermissions || allPermissions.length === 0) {
          this.logger.warn(
            'No permissions found in the database. Admin role will have no permissions.',
            'StoreService',
          );
          throw new Error('No permissions found in database to assign to admin role.');
        }

        // 3. Créer le rôle 'Admin' par défaut pour cette boutique
        adminRole = manager.getRepository(Role).create({
          name: 'Admin',
          description: 'Main Store Administrator',
          isDefault: true,
          storeId: newStore.id,
          permissions: allPermissions, // Associe les permissions au rôle
        });
        await manager.getRepository(Role).save(adminRole);
        if (!adminRole.id) {
          throw new Error('Failed to generate Admin Role ID during creation.');
        }
        this.logger.log(
          `Admin role created for store ${newStore.name}. Role ID: ${adminRole.id}.`,
          'StoreService',
        );

        // 4. Lier l'utilisateur propriétaire à la boutique avec le rôle 'Admin'
        newStoreUser = manager.getRepository(StoreUser).create({
          userId,
          storeId: newStore.id,
          roleId: adminRole.id, // Ici adminRole.id est maintenant vérifié
          status: StoreUserStatus.ACTIVE,
          joinedAt: new Date(),
        });
        await manager.getRepository(StoreUser).save(newStoreUser);
        if (!newStoreUser.id) {
          throw new Error('Failed to generate StoreUser ID during creation.');
        }
        this.logger.log(
          `StoreUser created for ${userEmail} in store ${newStore.name}. StoreUser ID: ${newStoreUser.id}.`,
          'StoreService',
        );

        newStoreUser.store = newStore;
        newStoreUser.role = adminRole;

        // 5. Créer la caisse enregistreuse par défaut
        defaultCashRegister = manager.getRepository(CashRegister).create({
          name: 'Main Cashier',
          description: 'Default shop checkout',
          active: true,
          storeId: newStore.id,
        });
        await manager.getRepository(CashRegister).save(defaultCashRegister);
        if (!defaultCashRegister.id) {
          throw new Error('Failed to generate Default Cash Register ID during creation.');
        }
        this.logger.log(
          `Default cash register created for store ${newStore.name}. ID: ${defaultCashRegister.id}.`,
          'StoreService',
        );

        // 6. Méthode de paiement par défaut pour la nouvelle boutique créée
        defaultPaymentMethod = manager.getRepository(PaymentMethod).create({
          // Correction nom variable
          name: 'cash',
          displayName: 'Cash',
          isActive: true,
          isDefault: true,
          storeId: newStore.id,
        });
        await manager.getRepository(PaymentMethod).save(defaultPaymentMethod); // Correction nom variable
        if (!defaultPaymentMethod.id) {
          throw new Error('Failed to generate Default Payment Method ID during creation.');
        }
        this.logger.log(
          `Default payment method 'cash' created for store ${newStore.name}. ID: ${defaultPaymentMethod.id}.`,
          'StoreService',
        );

        // 7. Créer les paramètres par défaut de la boutique
        const storeSettingsToCreate = getDefaultStoreSettings(newStore.id, newStoreUser).map(
          (setting) =>
            manager.getRepository(StoreSetting).create({
              ...setting,
              createdById: newStoreUser.id,
            }),
        );
        await manager.getRepository(StoreSetting).save(storeSettingsToCreate);
        this.logger.log(
          `${storeSettingsToCreate.length} default settings created for store ${newStore.name}.`,
          'StoreService',
        );

        return {
          store: newStore,
          storeUser: newStoreUser,
        };
      }); // Fin de la transaction

      const { store, storeUser } = result;

      // Génère les tokens après la transaction
      const tokens = await this.authService.generateTokens(ownerUser, storeUser);

      return {
        store,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to create store: ${err.message}`, err.stack, 'StoreService');
      throw error;
    }
  }

  // async findAllStores(): Promise<Store[]> {
  //   const {
  //     storeUserId: callerGlobalUserId,
  //     ipAddress,
  //     userAgent,
  //   } = this.requestContextService.getContext();

  //   const callerUser = await this.userRepository.findOne({ where: { id: callerGlobalUserId } });
  //   if (!callerUser || !callerUser.canCreateStore) {
  //     // canCreateStore est l'indicateur SuperAdmin
  //     throw new ForbiddenException(
  //       'Accès refusé. Seuls les Super-Admins peuvent lister toutes les boutiques.',
  //     );
  //   }

  //   const stores = await this.storeRepository.find({ relations: ['owner'] });

  //   this.logger.log(
  //     `SuperAdmin (User ID: ${callerGlobalUserId}) fetched all stores.`,
  //     'StoreService',
  //   );
  //   await this.auditLogsService.createAuditLog({
  //     storeId: null, // Pas de storeId spécifique car c'est une action globale
  //     storeUserId: callerGlobalUserId,
  //     actionType: AuditActionType.VIEW,
  //     entity: 'Store',
  //     entityId: 'null',
  //     notes: `SuperAdmin (User ID: ${callerGlobalUserId}) a consulté la liste de toutes les boutiques.`,
  //     ipAddress,
  //     userAgent,
  //   });

  //   return stores;
  // }
}
