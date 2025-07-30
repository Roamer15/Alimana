import { IsString, IsBoolean, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';
import { PaymentMethodType } from 'src/entities/payment-method.entity';

export class CreatePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  type?: PaymentMethodType;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsNumber()
  @IsNotEmpty()
  storeId: number;
}

export class UpdatePaymentMethodDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
