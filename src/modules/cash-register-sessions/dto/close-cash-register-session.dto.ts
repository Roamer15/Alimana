import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseCashRegisterSessionDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  closingCash: number;

  @IsOptional()
  @IsNumber()
  systemCashTotal: number;

  @IsString()
  @IsOptional()
  notes: string;
}
