import { Expose, Type } from 'class-transformer';
import { PaymentMethodType } from 'src/entities/payment-method.entity';

// Store
class StoreDto {
  @Expose()
  id: number;

  @Expose()
  name: string;
}

// User
class UserDataDto {
  @Expose()
  fullName: string;

  @Expose()
  email: string;
}

class UserDto {
  @Expose()
  id: number;

  @Expose()
  @Type(() => UserDataDto)
  user: UserDataDto;
}

// Sale Item
class SaleItemDto {
  @Expose()
  productName: string;

  @Expose()
  quantity: number;

  @Expose()
  unitPrice: number;

  @Expose()
  totalPrice: number;

  @Expose()
  discountPercentage: number;
}

// Payment Method
class PaymentMethodDto {
  @Expose()
  name: string;

  @Expose()
  type: PaymentMethodType;
}

// Payment
class PaymentDto {
  @Expose()
  amount: number;

  @Expose()
  paymentMethodId: number;

  @Expose()
  transactionReference?: string;

  @Expose()
  @Type(() => PaymentMethodDto)
  paymentMethod: PaymentMethodDto;
}

// Cash Register
class CashRegisterDto {
  @Expose()
  name: string;
}

// Cash Register Session
class CashRegisterSessionDto {
  @Expose()
  id: number;

  @Expose()
  @Type(() => CashRegisterDto)
  cashRegister: CashRegisterDto;
}

// SALE DTO FINAL
export class SaleDto {
  @Expose()
  id: number;

  @Expose()
  saleNumber: string;

  @Expose()
  totalAmount: number;

  @Expose()
  totalPaidAmount: number;

  @Expose()
  changeDue: number;

  @Expose()
  discount: number;

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => StoreDto)
  store: StoreDto;

  @Expose()
  @Type(() => UserDto)
  createdBy: UserDto;

  @Expose()
  @Type(() => CashRegisterSessionDto)
  cashRegisterSession: CashRegisterSessionDto;

  @Expose()
  @Type(() => SaleItemDto)
  saleItems: SaleItemDto[];

  @Expose()
  @Type(() => PaymentDto)
  payments: PaymentDto[];
}
