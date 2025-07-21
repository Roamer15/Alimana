import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class createCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(250)
  description: string;
}
