import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CashRegisterSession,
  CashRegisterSessionStatus,
} from 'src/entities/cash-register-session.entity';
import { CashRegister } from 'src/entities/cash-register.entity';
import { CreateCashRegisterSessionDto } from './dto/create-cash-register-session.dto';
import { CloseCashRegisterSessionDto } from './dto/close-cash-register-session.dto';
import { throwHttpError } from 'src/common/errors/http-exception.helper';
import { ErrorCode } from 'src/common/errors/error-codes.enum';
import { MyLoggerService } from 'src/my-logger/my-logger.service';

@Injectable()
export class CashRegisterSessionService {
  constructor(
    @InjectRepository(CashRegisterSession)
    private sessionRepo: Repository<CashRegisterSession>,
    @InjectRepository(CashRegister)
    private registerRepo: Repository<CashRegister>,
    private readonly logger: MyLoggerService,
  ) {}

  /**
   * Open a new cash register session
   */
  async openSession(storeUserId: number, dto: CreateCashRegisterSessionDto) {
    return await this.sessionRepo.manager.transaction(async (manager) => {
      try {
        this.logger.log(
          `Opening session for register ${dto.cashRegisterId} by user ${storeUserId}`,
        );

        // Check if register exists
        const register = await manager.getRepository(CashRegister).findOne({
          where: { id: dto.cashRegisterId, storeId: dto.storeId },
        });
        if (!register) {
          this.logger.warn('Cash register not found');
          throwHttpError(ErrorCode.CASH_REGISTER_NOT_FOUND);
        }

        // Ensure no open session exists for this register
        const existing = await manager.getRepository(CashRegisterSession).findOne({
          where: { cashRegisterId: dto.cashRegisterId, status: CashRegisterSessionStatus.OPEN },
        });
        if (existing) {
          this.logger.warn('Attempt to open session while one is already active');
          throwHttpError(ErrorCode.SESSION_ALREADY_OPEN);
        }

        const session = manager.getRepository(CashRegisterSession).create({
          storeId: dto.storeId,
          cashRegisterId: dto.cashRegisterId,
          storeUserId,
          initialCash: dto.initialCash,
          openedAt: new Date(),
          status: CashRegisterSessionStatus.OPEN,
          notes: dto.notes || null,
        });

        const savedSession = await manager.getRepository(CashRegisterSession).save(session);
        this.logger.log(`Session ${savedSession.id} opened successfully`);
        return savedSession;
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error('Error opening session', error.stack || error.message);
          throwHttpError(ErrorCode.SESSION_OPEN_FAILED, { error: error.message });
        }
        throwHttpError(ErrorCode.SESSION_OPEN_FAILED);
      }
    });
  }

  /**
   * Close an active session
   */
  async closeSession(sessionId: number, dto: CloseCashRegisterSessionDto) {
    return await this.sessionRepo.manager.transaction(async (manager) => {
      try {
        const session = await manager
          .getRepository(CashRegisterSession)
          .findOne({ where: { id: sessionId } });
        if (!session || session.status !== CashRegisterSessionStatus.OPEN) {
          throwHttpError(ErrorCode.SESSION_NOT_FOUND_OR_CLOSED);
        }

        session.closingCash = dto.closingCash;
        session.systemCashTotal = dto.systemCashTotal || session.systemCashTotal;
        session.closedAt = new Date();
        session.status = CashRegisterSessionStatus.CLOSED;
        session.notes = dto.notes || session.notes;

        const updatedSession = await manager.getRepository(CashRegisterSession).save(session);
        return updatedSession;
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error('Error closing session', error.stack || error.message);
          throwHttpError(ErrorCode.SESSION_CLOSE_FAILED, { error: error.message });
        }
        throwHttpError(ErrorCode.SESSION_CLOSE_FAILED);
      }
    });
  }

  /**
   * List all sessions for a store
   */
  async getSessionsForStore(storeId: number) {
    return this.sessionRepo.find({
      where: { storeId },
      order: { openedAt: 'DESC' },
    });
  }

  /**
   * Get details of a session
   */
  async getSessionDetails(sessionId: number) {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) {
      throwHttpError(ErrorCode.SESSION_NOT_FOUND, { sessionId });
    }
    return session;
  }
}
