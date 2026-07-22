import { Controller, Get, Put, Delete, Param, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import { UpdatePaymentMethodDto } from './dto/payment-method.dto';
import { PaymentMethod } from 'src/entities/payment-method.entity';

@Controller('store/:storeId/payment-methods')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Get()
  async findAll(@Param('storeId') storeId: number): Promise<PaymentMethod[]> {
    return this.paymentMethodService.findAll(storeId);
  }

  @Get(':id')
  async findOne(
    @Param('storeId') storeId: number,
    @Param('id') id: number,
  ): Promise<PaymentMethod> {
    return this.paymentMethodService.findOne(id, storeId);
  }

  @Put(':id')
  async update(
    @Param('storeId') storeId: number,
    @Param('id') id: number,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    return this.paymentMethodService.update(id, storeId, updatePaymentMethodDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('storeId') storeId: number, @Param('id') id: number): Promise<void> {
    await this.paymentMethodService.remove(id, storeId);
  }
}
