// src/cash-register-sessions/cash-register-sessions.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { CashRegisterSessionsService } from './cash-register-sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionKeys } from '../auth/decorators/permissions.decorator';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { PermissionKey } from '../store/constants/permission-enum';
import { CashRegisterSession } from 'src/entities/cash-register-session.entity';
import { OpenSessionDto } from './dto/open-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';

@Controller('store/:storeId/cash-register-sessions')
@UseGuards(JwtAuthGuard, PermissionsGuard) // Appliquer les guards sur tout le contrôleur
export class CashRegisterSessionsController {
  constructor(private readonly cashRegisterSessionsService: CashRegisterSessionsService) {}

  /**
   * Ouvre une nouvelle session de caisse.
   * Nécessite la permission 'open_cash_register_session'.
   */
  @Post('open')
  @PermissionKeys(PermissionKey.OPEN_CASH_REGISTER_SESSION)
  @HttpCode(HttpStatus.CREATED)
  async openSession(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() openSessionDto: OpenSessionDto,
  ): Promise<CashRegisterSession> {
    return this.cashRegisterSessionsService.openSession(openSessionDto, storeId);
  }

  /**
   * Ferme une session de caisse.
   * Nécessite la permission 'close_cash_register_session'.
   */

  @Post(':id/close')
  @PermissionKeys(PermissionKey.CLOSE_CASH_REGISTER_SESSION)
  @HttpCode(HttpStatus.OK)
  async closeSession(
    @Param('id', ParseIntPipe) sessionId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() closeSessionDto: CloseSessionDto,
  ): Promise<CashRegisterSession> {
    return this.cashRegisterSessionsService.closeSession(sessionId, closeSessionDto, storeId);
  }

  /**
   * Trouve une session de caisse par son ID.
   */
  @Get(':cashRegisterSessionId')
  @PermissionKeys(PermissionKey.VIEW_CASH_REGISTER_SESSIONS)
  @HttpCode(HttpStatus.OK)
  async getSessionById(
    @Param('cashRegisterSessionId', ParseIntPipe) sessionId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<CashRegisterSession> {
    return this.cashRegisterSessionsService.findOne(sessionId, storeId);
  }

  /**
   * Récupère toutes les sessions de caisse pour une boutique.
   * Nécessite la permission 'view_cash_register_sessions'.
   */
  @Get()
  @PermissionKeys(PermissionKey.VIEW_CASH_REGISTER_SESSIONS)
  @HttpCode(HttpStatus.OK)
  async getSessionsForStore(
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<CashRegisterSession[]> {
    return this.cashRegisterSessionsService.findAllSessionsForStore(storeId);
  }

  /**
   * Récupère la session de caisse ouverte pour une caisse spécifique.
   * Nécessite la permission 'view_cash_register_sessions'.
   */
  @Get(':cashRegisterId/open')
  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.VIEW_CASH_REGISTER_SESSIONS)
  @HttpCode(HttpStatus.OK)
  async getOpenSessionByCashRegister(
    @Param('cashRegisterId', ParseIntPipe) cashRegisterId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<CashRegisterSession | null> {
    return this.cashRegisterSessionsService.findOpenSessionByCashRegister(cashRegisterId, storeId);
  }
}
