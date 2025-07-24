import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CashMovementService } from './cash-movement.service';
import { PermissionKey } from '../store/constants/permission-enum';
import { CashMovement } from 'src/entities/cash-movement.entity';
import { PermissionKeys } from '../auth/decorators/permissions.decorator';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';

@Controller('store/:storeId/cash-movement')
@UseGuards(StoreJwtGuard, PermissionsGuard)
export class CashMovementController {
  constructor(private readonly cashMovementsService: CashMovementService) {}

  @Post()
  @PermissionKeys(PermissionKey.MANAGE_CASH_MOVEMENTS)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCashMovementDto: CreateCashMovementDto,
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<CashMovement> {
    return this.cashMovementsService.create(createCashMovementDto, storeId);
  }

  @Get('session/:sessionId')
  @PermissionKeys(PermissionKey.MANAGE_CASH_MOVEMENTS)
  @HttpCode(HttpStatus.OK)
  async getMovementsBySession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('storeId', ParseIntPipe) storeId: number,
  ): Promise<CashMovement[]> {
    return this.cashMovementsService.findMovementsBySession(sessionId, storeId);
  }
}
