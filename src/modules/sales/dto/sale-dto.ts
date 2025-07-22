// Exemple d'utilisation de class-validator
import { IsNumber, IsString, IsArray, ValidateNested, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  @IsNumber() @Min(1) productId: number;
  @IsNumber() @Min(1) quantity: number;
  @IsOptional() @IsNumber() @Min(0) itemDiscount?: number;
}

export class CreateSalePaymentDto {
  @IsNumber() @Min(1) paymentMethodId: number;
  @IsNumber() @Min(0) amount: number;
  @IsOptional() @IsString() transactionReference?: string;
}

export class CreateSaleDto {
  @IsNumber() @Min(1) cashRegisterSessionId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  saleItems: CreateSaleItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalePaymentDto)
  payments: CreateSalePaymentDto[];

  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
}
