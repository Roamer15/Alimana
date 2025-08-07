import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  barcode: string;

  @IsString()
  @IsOptional()
  sku: string;

  @IsString()
  @IsOptional()
  brand: string;

  @IsString()
  @IsOptional()
  unit: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sellingPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costPrice: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  discountPercentage: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  @Type(() => Number)
  quantityInStock: number;

  @IsString()
  @IsOptional()
  imageUrl: string;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId: number;
}
