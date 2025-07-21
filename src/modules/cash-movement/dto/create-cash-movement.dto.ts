import {
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsString,
  MaxLength,
  Min,
  IsOptional,
} from 'class-validator';
import { CashMovementType } from 'src/entities/cash-movement.entity';

export class CreateCashMovementDto {
  @IsNumber({}, { message: "L'ID de la session doit être un nombre." })
  @Min(1, { message: "L'ID de la session doit être positif." })
  @IsNotEmpty({ message: "L'ID de la session est requis." })
  cashRegisterSessionId: number;

  @IsEnum(CashMovementType, { message: "Le type de mouvement doit être 'in' ou 'out'." })
  @IsNotEmpty({ message: 'Le type de mouvement est requis.' })
  type: CashMovementType;

  @IsNumber({}, { message: 'Le montant doit être un nombre.' })
  @Min(0.01, { message: 'Le montant doit être supérieur à zéro.' })
  @IsNotEmpty({ message: 'Le montant est requis.' })
  amount: number;

  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères.' })
  @MaxLength(255, { message: 'La description ne doit pas dépasser 255 caractères.' })
  description?: string;
}
