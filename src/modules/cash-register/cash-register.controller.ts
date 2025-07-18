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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { UpdateCashRegisterDto } from './dto/update-cash-register.dto';

@UseGuards(JwtAuthGuard)
@Controller('cash-register')
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post()
  async createCashRegister(@Body() dto: CreateCashRegisterDto) {
    return this.cashRegisterService.createCashRegister(dto);
  }

  @Get(':storeId')
  async findAllByStore(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.cashRegisterService.getAllCashRegisters(storeId);
  }

  @Get('detail/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cashRegisterService.getCashRegisterById(id);
  }

  @Patch(':id')
  async updateCashRegister(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCashRegisterDto,
  ) {
    return this.cashRegisterService.updateCashRegister(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.cashRegisterService.deleteCashRegister(id);
  }
}
