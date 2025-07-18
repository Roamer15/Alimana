import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CashRegisterSessionService } from './cash-register-sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCashRegisterSessionDto } from './dto/create-cash-register-session.dto';
import { CloseCashRegisterSessionDto } from './dto/close-cash-register-session.dto';

@UseGuards(JwtAuthGuard)
@Controller('cash-register-sessions')
export class CashRegisterSessionsController {
  constructor(private readonly cashRegisterSessionsService: CashRegisterSessionService) {}

  @Post('open/:storeUserId') // To be modified upon completion of StoreAuth
  async open(
    @Param('storeUserId', ParseIntPipe) storeUserId: number,
    @Body() dto: CreateCashRegisterSessionDto,
  ) {
    return this.cashRegisterSessionsService.openSession(+storeUserId, dto);
  }

  @Patch(':id/close')
  async close(@Param('id', ParseIntPipe) id: number, @Body() dto: CloseCashRegisterSessionDto) {
    return this.cashRegisterSessionsService.closeSession(id, dto);
  }

  @Get('store/:storeId')
  async getSessions(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.cashRegisterSessionsService.getSessionsForStore(storeId);
  }

  @Get(':id')
  async getSession(@Param('id', ParseIntPipe) id: number) {
    return this.cashRegisterSessionsService.getSessionDetails(id);
  }
}
