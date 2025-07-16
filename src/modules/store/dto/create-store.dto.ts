import { IsString, IsOptional, IsEmail, Length, IsUrl, Matches } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @Length(2, 255)
  @Matches(/^[\p{L}0-9\s\-_,.']+$/u, {
    message: 'The store name contains unauthorized characters.',
  })
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  @Matches(/^[\p{L}0-9\s\-_,.']*$/u, {
    message: 'The description contains unauthorized characters.',
  })
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  @Matches(/^[\p{L}0-9\s\-_,.'/#]*$/u, {
    message: 'The address contains unauthorized characters.',
  })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Le numéro de téléphone doit être une chaîne de caractères.' })
  // Regex pour un format de téléphone international (ex: +1234567890, ou 06XXXXXXXX)
  @Matches(/^\+?[1-9]\d{1,14}$|^0\d{9}$/, {
    message: 'The phone number must be a valid phone number.',
  })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address.' })
  email?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid logo URL.' })
  logoUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid profile Image URL.' })
  profileImageUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid website URL.' })
  websiteUrl?: string;
}
