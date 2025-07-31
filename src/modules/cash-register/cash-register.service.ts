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

@Injectable()
export class CashRegisterService {
  private readonly ctx = CashRegisterService.name;
  constructor(
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepo: Repository<CashRegister>,
    @InjectRepository(Store)
    private storeRepo: Repository<Store>,
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
      const allRegisters = await this.cashRegisterRepo.find({ where: { store: { id: storeId } } });
      if (allRegisters.length === 0) {
        throwHttpError(ErrorCode.CASH_REGISTER_NOT_FOUND, { id: storeId });
      }
      this.logger.log(allRegisters.length);
      return allRegisters;
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
      this.logger.log(`Fetching cash register ID: ${id}`, this.ctx);
      const register = await this.cashRegisterRepo.findOne({ where: { id } });
      console.log(register);
      if (!register) {
        throwHttpError(ErrorCode.CASH_REGISTER_NOT_FOUND, { id });
      }
      return register;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error fetching cash register`, error.stack || error.message, this.ctx);
      }
      throwHttpError(ErrorCode.CASH_REGISTER_FETCH_FAILED, { error: String(Error) });
    }
  }

  async updateCashRegister(
    storeId: number,
    id: number,
    dto: UpdateCashRegisterDto,
  ): Promise<CashRegister> {
    this.validateStoreAccess(storeId);
    try {
      this.logger.log(`Updating cash register ID: ${id}`, this.ctx);
      const register = await this.getCashRegisterById(storeId, id);
      Object.assign(register, dto);
      return await this.cashRegisterRepo.save(register);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error deleting cash register ID: ${id}`,
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
      this.logger.log(`Deleting cash register ID: ${id}`, this.ctx);
      const result = await this.cashRegisterRepo.delete(id);
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
}
