import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  UseGuards,
  ParseIntPipe,
  Patch,
  Delete,
} from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
//import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { UpdateCashRegisterDto } from './dto/update-cash-register.dto';
import { StoreJwtGuard } from '../auth/guards/store-jwt.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionKeys } from '../auth/decorators/permissions.decorator';
import { PermissionKey } from '../store/constants/permission-enum';

@Controller('store/:storeId/cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_CASH_REGISTERS)
  @Post()
  async createCashRegister(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Body() dto: CreateCashRegisterDto,
  ) {
    return this.cashRegisterService.createCashRegister(storeId, dto);
  }

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_CASH_REGISTERS)
  @Get()
  async findAllByStore(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.cashRegisterService.getAllCashRegisters(storeId);
  }

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_CASH_REGISTERS)
  @Get('detail/:id')
  async findOne(@Param('storeId') storeId: number, @Param('id', ParseIntPipe) id: number) {
    return this.cashRegisterService.getCashRegisterById(storeId, id);
  }

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_CASH_REGISTERS)
  @Patch(':id')
  async updateCashRegister(
    @Param('storeId') storeId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCashRegisterDto,
  ) {
    return this.cashRegisterService.updateCashRegister(storeId, id, dto);
  }

  @UseGuards(StoreJwtGuard, PermissionsGuard)
  @PermissionKeys(PermissionKey.MANAGE_CASH_REGISTERS)
  @Delete(':id')
  async remove(@Param('storeId') storeId: number, @Param('id', ParseIntPipe) id: number) {
    return this.cashRegisterService.deleteCashRegister(storeId, id);
  }
}
