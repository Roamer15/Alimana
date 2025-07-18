import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCashRegisterSessionDto {
  @IsNumber()
  @IsNotEmpty()
  storeId: number;

  @IsNumber()
  @IsNotEmpty()
  cashRegisterId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  initialCash: number;

  @IsString()
  @IsOptional()
  notes: string;
}
