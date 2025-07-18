import { Injectable, NotFoundException } from '@nestjs/common';
import { MyLoggerService } from 'src/my-logger/my-logger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CashRegister } from 'src/entities/cash-register.entity';
import { Repository } from 'typeorm';
import { UpdateCashRegisterDto } from './dto/update-cash-register.dto';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepo: Repository<CashRegister>,
    private readonly logger: MyLoggerService,
  ) {}

  async createCashRegister(dto: CreateCashRegisterDto): Promise<CashRegister> {
    this.logger.log(`Creating cash register for store ID: ${dto.storeId}`);
    const cashRegister = this.cashRegisterRepo.create(dto);
    return this.cashRegisterRepo.save(cashRegister);
  }

  async findAllByStore(storeId: number): Promise<CashRegister[]> {
    this.logger.log(`Fetching cash registers for store ID: ${storeId}`);
    return this.cashRegisterRepo.find({ where: { storeId } });
  }

  async findOne(id: number): Promise<CashRegister> {
    const register = await this.cashRegisterRepo.findOne({ where: { id } });
    if (!register) throw new NotFoundException(`Cash register ${id} not found`);
    return register;
  }

  async update(id: number, dto: UpdateCashRegisterDto): Promise<CashRegister> {
    const register = await this.findOne(id);
    Object.assign(register, dto);
    return this.cashRegisterRepo.save(register);
  }

  async remove(id: number): Promise<void> {
    const result = await this.cashRegisterRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Cash register ${id} not found`);
    }
  }
}
