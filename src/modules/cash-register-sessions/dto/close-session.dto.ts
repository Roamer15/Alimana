import { IsNumber, Min, IsNotEmpty } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';

export class CloseSessionDto {
  // @ApiProperty({
  //   description: "Le montant d'argent réellement compté à la fin de la session",
  //   example: 17450.0,
  // })
  @IsNumber({}, { message: 'Le montant final doit être un nombre.' })
  @Min(0, { message: 'Le montant final ne peut pas être négatif.' })
  @IsNotEmpty({ message: 'Le montant final est requis.' })
  finalCash: number;
}
