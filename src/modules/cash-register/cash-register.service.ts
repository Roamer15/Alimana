// src/cash-register/cash-register.service.ts
import { Injectable } from '@nestjs/common';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CashRegister } from 'src/entities/cash-register.entity';
import { Repository } from 'typeorm';
import { UpdateCashRegisterDto } from './dto/update-cash-register.dto';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { Store } from 'src/entities/store.entity';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { RequestContextService } from 'src/common/context/request-context/request-context.service';
import {
  CashRegisterSessionStatus,
  CashRegisterSession,
} from 'src/entities/cash-register-session.entity'; // Import CashRegisterSession and its status

@Injectable()
export class CashRegisterService {
  private readonly ctx = CashRegisterService.name;
  constructor(
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepo: Repository<CashRegister>,
    @InjectRepository(Store)
    private storeRepo: Repository<Store>,
    @InjectRepository(CashRegisterSession) // Inject CashRegisterSession repository
    private readonly cashRegisterSessionRepo: Repository<CashRegisterSession>,
    private readonly requestContextService: RequestContextService,
    private readonly logger: MyLoggerService,
  ) {}

  private validateStoreAccess(storeId: number): void {
    const { storeId: contextStoreId } = this.requestContextService.getContext();

    if (!contextStoreId) {
      throwHttpError(ErrorCode.CONTEXT_INFO_NOTFOUND);
    }

    if (contextStoreId !== storeId) {
      throwHttpError(ErrorCode.FORBIDDEN, {
        reason: 'Access denied. You can only view settings for your current store.',
      });
    }
  }

  async createCashRegister(storeId: number, dto: CreateCashRegisterDto): Promise<CashRegister> {
    this.validateStoreAccess(storeId);
    return this.cashRegisterRepo.manager.transaction(async (manager) => {
      try {
        this.logger.log(`Creating cash register for store ID: ${storeId}`, this.ctx);

        const store = await manager.getRepository(Store).findOne({ where: { id: storeId } });
        if (!store) {
          this.logger.warn(`Store not found: ${storeId}`, this.ctx);
          throwHttpError(ErrorCode.STORE_NOT_FOUND, { storeId: storeId });
        }

        const register = manager.getRepository(CashRegister).create({
          ...dto,
          store,
        });

        const saved = await manager.getRepository(CashRegister).save(register);
        this.logger.log(`Cash register created: ID ${saved.id}`, this.ctx);

        return saved;
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(`Error creating cash register`, error.stack || error.message, this.ctx);
          throwHttpError(ErrorCode.CASH_REGISTER_CREATION_FAILED, { error: error.message });
        }
        throwHttpError(ErrorCode.CASH_REGISTER_CREATION_FAILED, { error: String(error) });
      }
    });
  }

  async getAllCashRegisters(storeId: number): Promise<CashRegister[]> {
    this.validateStoreAccess(storeId);
    try {
      this.logger.log(`Fetching cash registers for store ID: ${storeId}`, this.ctx);
      const allRegisters = await this.cashRegisterRepo
        .createQueryBuilder('cashRegister')
        .leftJoinAndSelect('cashRegister.store', 'store')
        .leftJoinAndSelect(
          'cashRegister.cashRegisterSessions',
          'openSession',
          'openSession.status = :status',
          { status: CashRegisterSessionStatus.OPEN },
        )
        .where('store.id = :storeId', { storeId })
        .getMany();

      // Since OneToOne with conditional join is complex in TypeORM, manually assign the open session
      const registersWithOpenSession = await Promise.all(
        allRegisters.map(async (register) => {
          const openSession = await this.cashRegisterSessionRepo.findOne({
            where: {
              cashRegisterId: register.id,
              status: CashRegisterSessionStatus.OPEN,
            },
          });
          return { ...register, currentOpenSession: openSession };
        }),
      );

      if (registersWithOpenSession.length === 0) {
        throwHttpError(ErrorCode.CASH_REGISTER_NOT_FOUND, { id: storeId });
      }
      this.logger.log(`Found ${registersWithOpenSession.length} cash registers`, this.ctx);
      return registersWithOpenSession;
    } catch (error) {
      if (error instanceof Error) {
        throw error; // Let intentional errors pass through
      }

      // Only handle unexpected errors
      this.logger.error(
        `Error fetching cash registers`,
        error instanceof Error ? error.stack || error.message : String(error),
        this.ctx,
      );
      throwHttpError(ErrorCode.CASH_REGISTER_FETCH_FAILED, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getCashRegisterById(storeId: number, id: number): Promise<CashRegister> {
    this.validateStoreAccess(storeId);
    try {
      this.logger.log(`Fetching cash register ID: ${id} for store ID: ${storeId}`, this.ctx);
      const register = await this.cashRegisterRepo.findOne({
        where: { id: id, storeId: storeId },
        relations: ['store'],
      });

      if (!register) {
        throwHttpError(ErrorCode.CASH_REGISTER_NOT_FOUND, { id });
      }

      // Manually find the open session
      const openSession = await this.cashRegisterSessionRepo.findOne({
        where: {
          cashRegisterId: register.id,
          status: CashRegisterSessionStatus.OPEN,
        },
      });

      // Assign the open session to the register object
      register.currentOpenSession = openSession;

      return register;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error fetching cash register`, error.stack || error.message, this.ctx);
      }
      throwHttpError(ErrorCode.CASH_REGISTER_FETCH_FAILED, { error: String(error) });
    }
  }

  async updateCashRegister(
    storeId: number,
    id: number,
    dto: UpdateCashRegisterDto,
  ): Promise<CashRegister> {
    this.validateStoreAccess(storeId);
    try {
      this.logger.log(`Updating cash register ID: ${id} for store ID: ${storeId}`, this.ctx);
      const register = await this.getCashRegisterById(storeId, id); // Use existing method to get and validate
      Object.assign(register, dto);
      const updatedRegister = await this.cashRegisterRepo.save(register);
      // Ensure currentOpenSession is still present after save if it was
      const openSession = await this.cashRegisterSessionRepo.findOne({
        where: {
          cashRegisterId: updatedRegister.id,
          status: CashRegisterSessionStatus.OPEN,
        },
      });
      updatedRegister.currentOpenSession = openSession;
      return updatedRegister;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error updating cash register ID: ${id}`,
          error.stack || error.message,
          this.ctx,
        );
        throwHttpError(ErrorCode.CASH_REGISTER_UPDATE_FAILED, { error: error.message });
      }
      throwHttpError(ErrorCode.CASH_REGISTER_UPDATE_FAILED, { error: String(error) });
    }
  }

  async deleteCashRegister(storeId: number, id: number): Promise<void> {
    this.validateStoreAccess(storeId);
    try {
      this.logger.log(`Deleting cash register ID: ${id} for store ID: ${storeId}`, this.ctx);
      const result = await this.cashRegisterRepo.delete({ id: id, storeId: storeId }); // Ensure deletion is scoped to the store
      if (result.affected === 0) {
        throwHttpError(ErrorCode.CASH_REGISTER_NOT_FOUND, { id });
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error deleting cash register ID: ${id}`,
          error.stack || error.message,
          this.ctx,
        );
        throwHttpError(ErrorCode.CASH_REGISTER_DELETE_FAILED, { error: error.message });
      }
      throwHttpError(ErrorCode.CASH_REGISTER_DELETE_FAILED, { error: String(error) });
    }
  }

  // New method: Get historical sessions for a cash register
  async getCashRegisterHistory(
    storeId: number,
    cashRegisterId: number,
  ): Promise<CashRegisterSession[]> {
    this.validateStoreAccess(storeId);
    try {
      this.logger.log(
        `Fetching historical sessions for cash register ID: ${cashRegisterId} in store ID: ${storeId}`,
        this.ctx,
      );

      // Verify the cash register exists and belongs to the store
      const cashRegister = await this.cashRegisterRepo.findOne({
        where: { id: cashRegisterId, storeId: storeId },
      });
      if (!cashRegister) {
        throwHttpError(ErrorCode.CASH_REGISTER_NOT_FOUND, { id: cashRegisterId });
      }

      // Fetch all sessions for this cash register, ordered by openedAt descending
      const sessions = await this.cashRegisterSessionRepo.find({
        where: { cashRegisterId: cashRegisterId },
        relations: ['openedBy', 'closedBy'], // Include who opened and closed the session
        order: { openedAt: 'DESC' },
      });

      this.logger.log(
        `Found ${sessions.length} historical sessions for cash register ID: ${cashRegisterId}`,
        this.ctx,
      );
      return sessions;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error fetching history for cash register ID: ${cashRegisterId}`,
          error.stack || error.message,
          this.ctx,
        );
      }
      throwHttpError(ErrorCode.CASH_REGISTER_FETCH_FAILED, { error: String(error) });
    }
  }
}
