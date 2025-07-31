import { IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CloseSessionDto {
  @IsNumber({}, { message: 'Le montant final doit être un nombre.' })
  @Min(0, { message: 'Le montant final ne peut pas être négatif.' })
  @IsNotEmpty({ message: 'Le montant final est requis.' })
  finalCash: number;
}
