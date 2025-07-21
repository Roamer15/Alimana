// src/cash-movements/cash-movements.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import {
  CashRegisterSession,
  CashRegisterSessionStatus,
} from 'src/entities/cash-register-session.entity';
import { StoreUser, StoreUserStatus } from 'src/entities/store-user.entity';
import { CashMovement } from 'src/entities/cash-movement.entity';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';

@Injectable()
export class CashMovementService {
  constructor(
    @InjectRepository(CashMovement)
    private readonly cashMovementRepository: Repository<CashMovement>,
    @InjectRepository(CashRegisterSession)
    private readonly sessionRepository: Repository<CashRegisterSession>,
    @InjectRepository(StoreUser)
    private readonly storeUserRepository: Repository<StoreUser>,
    private readonly dataSource: DataSource,
    private readonly logger: MyLoggerService,
    private readonly requestContextService: RequestContextService,
  ) {}

  private validateStoreContext(storeId: number) {
    const { storeId: contextStoreId } = this.requestContextService.getContext();

    if (!contextStoreId) throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);

    if (contextStoreId !== storeId) {
      throwHttpError(ErrorCode.FORBIDDEN, {
        reason: 'Access denied. You can only access resources from your current store.',
      });
    }
    return contextStoreId;
  }

  /**
   * Crée un nouveau mouvement de caisse (dépôt ou retrait).
   * @returns Le mouvement de caisse créé.
   */
  async create(
    createCashMovementDto: CreateCashMovementDto,
    storeId: number,
  ): Promise<CashMovement> {
    const { cashRegisterSessionId, type, amount, description } = createCashMovementDto;

    const { storeUserId: createdByStoreUserId } = this.requestContextService.getContext();

    const contextStoreId = this.validateStoreContext(storeId);

    if (!createdByStoreUserId) throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);

    this.logger.log(
      `Tentative de création de mouvement de caisse (${type}) de ${amount} pour session ID ${cashRegisterSessionId}`,
      'CashMovementsService',
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Vérifier la session de caisse
      const cashSession = await queryRunner.manager.findOne(CashRegisterSession, {
        where: { id: cashRegisterSessionId },
        relations: ['cashRegister'], // Pour obtenir le storeId
      });
      if (!cashSession) {
        throw new NotFoundException(
          `Session de caisse avec ID ${cashRegisterSessionId} introuvable.`,
        );
      }
      if (cashSession.status !== CashRegisterSessionStatus.OPEN) {
        throw new BadRequestException(
          `La session de caisse avec ID ${cashRegisterSessionId} n'est pas ouverte.`,
        );
      }

      // 2. Vérifier l'utilisateur et sa permission
      const createdBy = await queryRunner.manager.findOne(StoreUser, {
        where: {
          id: createdByStoreUserId,
          storeId: contextStoreId,
          status: StoreUserStatus.ACTIVE,
        },
        relations: ['user'],
      });
      if (!createdBy) {
        throw new NotFoundException(
          `Utilisateur de magasin avec ID ${createdByStoreUserId} introuvable ou inactif.`,
        );
      }

      // 3. Créer le mouvement de caisse
      const newMovement = queryRunner.manager.create(CashMovement, {
        storeId: contextStoreId,
        cashRegisterSession: cashSession,
        cashRegisterSessionId: cashSession.id,
        type: type,
        amount: amount,
        description: description,
        createdBy: createdBy,
        createdByStoreUserId: createdBy.id,
        createdAt: new Date(),
      });

      const savedMovement = await queryRunner.manager.save(CashMovement, newMovement);
      this.logger.log(
        `Mouvement de caisse ID ${savedMovement.id} (${type} ${amount}) créé avec succès pour session ID ${cashRegisterSessionId}`,
        'CashMovementsService',
      );

      await queryRunner.commitTransaction();
      return savedMovement;
    } catch (error) {
      const err = error as Error;
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Échec de la création de mouvement de caisse pour session ID ${cashRegisterSessionId}: ${err.message}`,
        err.stack,
        'CashMovementsService',
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Récupère les mouvements de caisse pour une session donnée.
   * @returns Liste des mouvements.
   */
  async findMovementsBySession(sessionId: number, storeId: number): Promise<CashMovement[]> {
    const contextStoreId = this.validateStoreContext(storeId);
    this.logger.log(
      `Mouvement de caisse recupere pour le storeID ${contextStoreId}  avec succès`,
      'CashMovementsService',
    );

    return this.cashMovementRepository.find({
      where: { cashRegisterSessionId: sessionId },
      relations: ['createdBy.user'], // Charger le nom de l'utilisateur
      order: { createdAt: 'ASC' },
    });
  }
}
