import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from 'src/entities/payment-method.entity';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/payment-method.dto';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async create(createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const { storeId, name } = createPaymentMethodDto;

    // Check for existing payment method with the same name and storeId
    const existingPaymentMethod = await this.paymentMethodRepository.findOne({
      where: { storeId, name },
    });
    if (existingPaymentMethod) {
      throw new ConflictException(
        `Payment method with name "${name}" already exists for store ID ${storeId}`,
      );
    }

    const paymentMethod = this.paymentMethodRepository.create(createPaymentMethodDto);
    return this.paymentMethodRepository.save(paymentMethod);
  }

  async findAll(storeId: number): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find({ where: { storeId } });
  }

  async findOne(id: number, storeId: number): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({ where: { id, storeId } });
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found for store ID ${storeId}`);
    }
    return paymentMethod;
  }

  async update(
    id: number,
    storeId: number,
    updatePaymentMethodDto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    const paymentMethod = await this.findOne(id, storeId); // Reuses findOne to ensure existence and store ownership

    // Check for unique name constraint if name is being updated
    if (updatePaymentMethodDto.name && updatePaymentMethodDto.name !== paymentMethod.name) {
      const existingPaymentMethod = await this.paymentMethodRepository.findOne({
        where: { storeId, name: updatePaymentMethodDto.name },
      });
      if (existingPaymentMethod && existingPaymentMethod.id !== id) {
        throw new ConflictException(
          `Payment method with name "${updatePaymentMethodDto.name}" already exists for store ID ${storeId}`,
        );
      }
    }

    Object.assign(paymentMethod, updatePaymentMethodDto);
    return this.paymentMethodRepository.save(paymentMethod);
  }

  async remove(id: number, storeId: number): Promise<void> {
    const result = await this.paymentMethodRepository.delete({ id, storeId });
    if (result.affected === 0) {
      throw new NotFoundException(`Payment method with ID ${id} not found for store ID ${storeId}`);
    }
  }
}
