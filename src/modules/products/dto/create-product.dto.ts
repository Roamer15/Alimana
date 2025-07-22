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
  @IsNotEmpty()
  @Min(0)
  sellingPrice: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  costPrice: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  quantityInStock: number;

  @IsString()
  @IsOptional()
  imageUrl: string;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsInt()
  categoryId: number;
}
