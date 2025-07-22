import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CashMovement, CashMovementType } from 'src/entities/cash-movement.entity';
import {
  CashRegisterSession,
  CashRegisterSessionStatus,
} from 'src/entities/cash-register-session.entity';
import { CashRegister } from 'src/entities/cash-register.entity';
import { Sale } from 'src/entities/sale.entity';
import { StoreUser, StoreUserStatus } from 'src/entities/store-user.entity';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { Repository, DataSource } from 'typeorm';
import { OpenSessionDto } from './dto/open-session.dto';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { CloseSessionDto } from './dto/close-session.dto';

@Injectable()
export class CashRegisterSessionsService {
  constructor(
    @InjectRepository(CashRegisterSession)
    private readonly sessionRepository: Repository<CashRegisterSession>,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
    @InjectRepository(StoreUser)
    private readonly storeUserRepository: Repository<StoreUser>,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(CashMovement)
    private readonly cashMovementRepository: Repository<CashMovement>,
    private readonly dataSource: DataSource, // Pour les transactions
    private readonly logger: MyLoggerService, // Injection du logger
    private readonly requestContextService: RequestContextService,
  ) {}

  /**
   * Ouvre une nouvelle session de caisse.
   * @returns La session de caisse ouverte.
   */
  async openSession(openSessionDto: OpenSessionDto, storeId: number): Promise<CashRegisterSession> {
    const { cashRegisterId, initialCash, notes } = openSessionDto;

    const { storeUserId: openedByStoreUserId, storeId: contextStoreId } =
      this.requestContextService.getContext();

    if (!openedByStoreUserId || !contextStoreId) {
      throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);
    }

    // Vérification supplémentaire pour s'assurer que l'utilisateur est bien dans la bonne boutique
    if (contextStoreId !== storeId) {
      throwHttpError(ErrorCode.FORBIDDEN, {
        raeson: 'Accès refusé. Vous ne pouvez voir  que les resources de votre boutique actuelle.',
      });
    }

    this.logger.log(
      `Tentative d'ouverture de session pour la caisse ID ${cashRegisterId} par l'utilisateur ID ${openedByStoreUserId}`,
      'CashRegisterSessionsService',
    );
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //  Vérifier la caisse et l'utilisateur
      const cashRegister = await queryRunner.manager.findOne(CashRegister, {
        where: { id: cashRegisterId, storeId: contextStoreId },
      });
      if (!cashRegister) {
        throw new NotFoundException(
          `Caisse avec ID ${cashRegisterId} introuvable dans le magasin ${contextStoreId}.`,
        );
      }

      const openedBy = await queryRunner.manager.findOne(StoreUser, {
        where: { id: openedByStoreUserId, storeId: contextStoreId, status: StoreUserStatus.ACTIVE },
        relations: ['role', 'user'], // Charger le rôle et user
      });
      if (!openedBy) {
        throw new NotFoundException(
          `Utilisateur de magasin avec ID ${openedByStoreUserId} introuvable ou inactif dans le magasin ${contextStoreId}.`,
        );
      }

      // 2. Vérifier si une session est déjà ouverte pour cette caisse
      const existingOpenSession = await queryRunner.manager.findOne(CashRegisterSession, {
        where: {
          cashRegisterId: cashRegisterId,
          status: CashRegisterSessionStatus.OPEN,
        },
      });
      if (existingOpenSession) {
        throw new BadRequestException(
          `Une session est déjà ouverte pour la caisse '${cashRegister.name}' (ID: ${cashRegisterId}). Session ID: ${existingOpenSession.id}`,
        );
      }

      // 3. Créer la nouvelle session
      const newSession = queryRunner.manager.create(CashRegisterSession, {
        storeId: contextStoreId,
        cashRegister: cashRegister,
        cashRegisterId: cashRegister.id,
        openedBy: openedBy,
        openedById: openedBy.id,
        initialCash: initialCash,
        notes: notes,
        status: CashRegisterSessionStatus.OPEN,
        openedAt: new Date(),
      });

      const savedSession = await queryRunner.manager.save(CashRegisterSession, newSession);
      this.logger.log(
        `Session de caisse ID ${savedSession.id} ouverte avec succès pour la caisse ID ${cashRegisterId}`,
        'CashRegisterSessionsService',
      );

      await queryRunner.commitTransaction();
      return savedSession;
    } catch (error) {
      const err = error as Error;

      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Échec de l'ouverture de session pour la caisse ID ${cashRegisterId}: ${err.message}`,
        err.stack,
        'CashRegisterSessionsService',
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Ferme une session de caisse existante..
   * @returns La session de caisse fermée.
   */
  async closeSession(
    sessionId: number,
    closeSessionDto: CloseSessionDto,
    storeId: number,
  ): Promise<CashRegisterSession> {
    const { finalCash } = closeSessionDto;

    const { storeId: contextStoreId, storeUserId: closedByStoreUserId } =
      this.requestContextService.getContext();

    if (!contextStoreId || !closedByStoreUserId) {
      throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);
    }

    // Vérification supplémentaire pour s'assurer que l'utilisateur est bien dans la bonne boutique
    if (contextStoreId !== storeId) {
      throwHttpError(ErrorCode.FORBIDDEN, {
        raeson: 'Accès refusé. Vous ne pouvez voir  que les resources de votre boutique actuelle.',
      });
    }

    this.logger.log(
      `Tentative de fermeture de session ID ${sessionId} par l'utilisateur ID ${closedByStoreUserId}`,
      'CashRegisterSessionsService',
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Vérifier la session et l'utilisateur
      const session = await queryRunner.manager.findOne(CashRegisterSession, {
        where: { id: sessionId },
        relations: ['cashRegister', 'openedBy'], // Charger les relations nécessaires
      });
      if (!session) {
        throw new NotFoundException(`Session de caisse avec ID ${sessionId} introuvable.`);
      }
      if (session.status === CashRegisterSessionStatus.CLOSED) {
        throw new BadRequestException(`La session avec ID ${sessionId} est déjà fermée.`);
      }

      const closedBy = await queryRunner.manager.findOne(StoreUser, {
        where: { id: closedByStoreUserId },
        relations: ['role', 'user'], // Charger le rôle et user
      });
      if (!closedBy) {
        throw new NotFoundException(
          `Utilisateur de magasin avec ID ${closedByStoreUserId} introuvable.`,
        );
      }

      //  Calculer le montant d'argent attendu (expectedCash)
      // Récupérer toutes les ventes de cette session
      const sales = await queryRunner.manager.find(Sale, {
        where: { cashRegisterSessionId: sessionId },
      });
      const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

      // Récupérer tous les mouvements de caisse de cette session
      const cashMovements = await queryRunner.manager.find(CashMovement, {
        where: { cashRegisterSessionId: sessionId },
      });
      const totalCashInMovements = cashMovements
        .filter((m) => m.type === CashMovementType.IN)
        .reduce((sum, m) => sum + m.amount, 0);
      const totalCashOutMovements = cashMovements
        .filter((m) => m.type === CashMovementType.OUT)
        .reduce((sum, m) => sum + m.amount, 0);

      const expectedCash =
        session.initialCash + totalSales + totalCashInMovements - totalCashOutMovements;
      const discrepancy = finalCash - expectedCash;

      // 3. Mettre à jour la session
      session.closingCash = finalCash;
      session.expectedCash = expectedCash;
      session.discrepancy = discrepancy;
      session.status = CashRegisterSessionStatus.CLOSED;
      session.closedBy = closedBy;
      session.closedAt = new Date();

      const savedSession = await queryRunner.manager.save(CashRegisterSession, session);
      this.logger.log(
        `Session de caisse ID ${savedSession.id} fermée avec succès. Écart: ${discrepancy}`,
        'CashRegisterSessionsService',
      );

      await queryRunner.commitTransaction();
      return savedSession;
    } catch (error) {
      const err = error as Error;
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Échec de la fermeture de session ID ${sessionId}: ${err.message}`,
        err.stack,
        'CashRegisterSessionsService',
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Trouve une session de caisse par son ID.
   * @returns La session de caisse.
   */

  //  récupérer une session
  async findOne(sessionId: number, storeId: number): Promise<CashRegisterSession> {
    const { storeId: contextStoreId } = this.requestContextService.getContext();

    if (!contextStoreId) {
      throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);
    }
    // Vérification supplémentaire pour s'assurer que l'utilisateur est bien dans la bonne boutique
    if (contextStoreId !== storeId) {
      throwHttpError(ErrorCode.FORBIDDEN, {
        raeson: 'Accès refusé. Vous ne pouvez voir  que les resources de votre boutique actuelle.',
      });
    }

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['cashRegister', 'openedBy', 'closedBy', 'sales', 'cashMovements'],
    });
    if (!session) {
      throw new NotFoundException(`Session de caisse avec ID ${sessionId} introuvable.`);
    }
    return session;
  }

  /**
   * Trouve la session ouverte pour une caisse donnée.
   * @returns La session ouverte ou null.
   */

  async findOpenSessionByCashRegister(
    cashRegisterId: number,
    storeId: number,
  ): Promise<CashRegisterSession | null> {
    const { storeId: contextStoreId } = this.requestContextService.getContext();

    if (!contextStoreId) {
      throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);
    }
    // Vérification supplémentaire pour s'assurer que l'utilisateur est bien dans la bonne boutique
    if (contextStoreId !== storeId) {
      throwHttpError(ErrorCode.FORBIDDEN, {
        raeson: 'Accès refusé. Vous ne pouvez voir  que les resources de votre boutique actuelle.',
      });
    }
    return this.sessionRepository.findOne({
      where: { cashRegisterId: cashRegisterId, status: CashRegisterSessionStatus.OPEN },
    });
  }

  /**
   * Récupère toutes les sessions pour un magasin donné.
   * @returns Liste des sessions.
   */

  async findAllSessionsForStore(storeId: number): Promise<CashRegisterSession[]> {
    return this.sessionRepository.find({
      where: { cashRegister: { storeId: storeId } },
      relations: ['cashRegister', 'openedBy', 'closedBy'],
      order: { openedAt: 'DESC' },
    });
  }
}
