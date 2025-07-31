import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
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

// DTO pour la mise à jour de boutique
export class UpdateStoreDto {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
}

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

  /**
   * Récupère une boutique par son ID.
   * Accessible par le Super-Admin, le propriétaire de la boutique, ou un StoreUser de cette boutique.
   * @param id L'ID de la boutique.
   * @returns La boutique trouvée.
   */

  async findStoreById(id: number): Promise<Store> {
    const { userId, storeUserId } = this.requestContextService.getContext();

    if (!userId || !storeUserId) {
      throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND, {
        userId,
        storeUserId,
      });
    }

    const store = await this.storeRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!store) {
      throwHttpError(ErrorCode.STORE_NOT_FOUND, { id });
    }

    let isAuthorized = false;

    //  Si c'est le propriétaire de la boutique
    if (store.ownerId === userId) {
      isAuthorized = true;
    }
    // 3. Si c'est un StoreUser de cette boutique
    else if (storeUserId) {
      const isStoreUserOfThisStore = await this.storeUserRepository.findOne({
        where: { id: storeUserId, store: { id: id }, user: { id: userId } },
      });
      if (isStoreUserOfThisStore) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException(`Accès refusé à la boutique avec l'ID ${id}.`);
    }

    return store;
  }

  /**
   * Updates a store's information.
   * Accessible by the store owner or a StoreUser with 'manage_store_settings' permission.
   * @param id The ID of the store to update.
   * @param updateStoreDto The update data.
   * @returns The updated store.
   */
  async updateStore(id: number, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const { userId, storeId: contextStoreId } = this.requestContextService.getContext();

    if (!userId || !contextStoreId) {
      throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND, {
        userId,
        contextStoreId,
      });
    }
    // Fetch the store to get its ownerId
    const store = await this.storeRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!store) {
      throwHttpError(ErrorCode.STORE_NOT_FOUND, { id });
    }

    let isAuthorized = false;

    // 1. If it's the owner of the boutique
    if (store.ownerId === userId) {
      isAuthorized = true;
    }
    // 2. If it's a StoreUser of this boutique AND the storeId in the token matches the requested ID
    // (The PermissionsGuard already ensures 'manage_store_settings' for StoreUsers)
    else if (contextStoreId === id) {
      const isStoreUserOfThisStore = await this.storeUserRepository.findOne({
        where: { user: { id: userId }, store: { id: id } },
      });
      if (isStoreUserOfThisStore) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException('Access denied. You are not allowed to edit this store.');
    }

    // const oldValue = JSON.parse(JSON.stringify(store)); // Capture l'ancienne valeur

    // Apply updates
    Object.assign(store, updateStoreDto);
    const updatedStore = await this.storeRepository.save(store);

    this.logger.log(`Store ID ${id} updated by User (ID: ${userId}).`, 'StoreService');
    // await this.auditLogsService.createAuditLog({
    //   storeId: updatedStore.id,
    //   storeUserId: contextStoreId || userId,
    //   actionType: AuditActionType.UPDATE,
    //   entity: 'Store',
    //   entityId: String(updatedStore.id),
    //   oldValue: oldValue,
    //   newValue: JSON.parse(JSON.stringify(updatedStore)),
    //   ipAddress,
    //   userAgent,
    //   notes: `Boutique "${updatedStore.name}" (ID: ${updatedStore.id}) mise à jour par l'utilisateur (ID: ${userId}).`,
    // });

    return updatedStore;
  }

  /**
   * Deletes a store.
   * Accessible only by the store owner.
   * @param id The ID of the store to delete.
   * @returns true if the deletion is successful..
   */
  async deleteStore(id: number): Promise<boolean> {
    const { userId } = this.requestContextService.getContext();

    if (!userId) {
      throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND, {
        userId,
      });
    }

    const storeToDelete = await this.storeRepository.findOne({ where: { id } });
    if (!storeToDelete) {
      throwHttpError(ErrorCode.STORE_NOT_FOUND, { id });
    }

    //  Checks if the user is the owner of the shop
    if (storeToDelete.ownerId !== userId) {
      throw new ForbiddenException('Access denied. Only the shop owner can delete it..');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Store).remove(storeToDelete);
    });

    this.logger.log(`Store ID ${id} deleted by owner (User ID: ${userId}).`, 'StoreService');
    // await this.auditLogsService.createAuditLog({
    //   storeId: null, // The store is being deleted, so no specific storeId context
    //   storeUserId: userId,
    //   actionType: AuditActionType.DELETE,
    //   entity: 'Store',
    //   entityId: String(id),
    //   oldValue: JSON.parse(JSON.stringify(storeToDelete)),
    //   newValue: null,
    //   ipAddress,
    //   userAgent,
    //   notes: `Boutique "${storeToDelete.name}" (ID: ${storeToDelete.id}) supprimée par son propriétaire (User ID: ${userId}).`,
    // });

    return true;
  }
}
