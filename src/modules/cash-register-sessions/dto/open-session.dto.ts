import { IsNumber, Min, IsNotEmpty, IsOptional, IsString } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';

export class OpenSessionDto {
  // @ApiProperty({ description: "L'ID de la caisse à ouvrir", example: 1 })
  @IsNumber({}, { message: "L'ID de la caisse doit être un nombre." })
  @Min(1, { message: "L'ID de la caisse doit être positif." })
  @IsNotEmpty({ message: "L'ID de la caisse est requis." })
  cashRegisterId: number;

  // @ApiProperty({ description: "Le montant initial d'argent dans la caisse", example: 15000.0 })
  @IsNumber({}, { message: 'Le montant initial doit être un nombre.' })
  @Min(0, { message: 'Le montant initial ne peut pas être négatif.' })
  @IsNotEmpty({ message: 'Le montant initial est requis.' })
  initialCash: number;

  @IsOptional()
  @IsString({ message: 'La note doit être une chaîne de caractères.' })
  notes?: string;
}
