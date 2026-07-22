import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { AuthProvider } from 'src/entities/User.entity'; // Assurez-vous que le chemin d'importation est correct

export class RegisterDto {
  @IsEmail({}, { message: "L'adresse e-mail doit être une adresse e-mail valide." })
  @MaxLength(255, { message: "L'adresse e-mail ne doit pas dépasser 255 caractères." })
  @IsNotEmpty({ message: "L'adresse e-mail est requise." })
  email: string;

  @IsOptional()
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(60, { message: 'Le mot de passe ne doit pas dépasser 60 caractères.' })
  // Au moins une majuscule, une minuscule, un chiffre et un caractère spécial
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\\[\]|\\:;"'<>,.?/~`]).{8,60}$/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.',
  })
  password?: string; // Optionnel car l'authentification peut se faire via un fournisseur tiers

  @IsString({ message: 'Le nom complet doit être une chaîne de caractères.' })
  @MinLength(2, { message: 'Le nom complet doit contenir au moins 2 caractères.' })
  @MaxLength(100, { message: 'Le nom complet ne doit pas dépasser 100 caractères.' })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'Le nom complet ne doit contenir que des lettres, des espaces, des tirets et des apostrophes.',
  })
  @IsNotEmpty({ message: 'Le nom complet est requis.' })
  fullName: string;

  @IsOptional()
  @IsString({ message: 'Le numéro de téléphone doit être une chaîne de caractères.' })
  // Regex pour un format de téléphone international (ex: +1234567890, ou 06XXXXXXXX)
  @Matches(/^\+?[1-9]\d{1,14}$|^0\d{9}$/, {
    message: 'Le numéro de téléphone doit être un numéro de téléphone valide.',
  })
  phone?: string;

  @IsOptional()
  @IsString({ message: "L'URL de l'avatar doit être une chaîne de caractères." })
  @Matches(/^https?:\/\/.+\.(jpg|jpeg|png|gif|svg)$/, {
    message: "L'URL de l'avatar doit être une URL d'image valide (jpg, jpeg, png, gif, svg).",
  })
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(AuthProvider, { message: "Le fournisseur d'authentification n'est pas valide." })
  @IsNotEmpty({ message: "Le fournisseur d'authentification est requis." })
  authProvider: AuthProvider;

  @IsOptional()
  @IsString({ message: "L'ID du fournisseur doit être une chaîne de caractères." })
  @IsNotEmpty({
    message: "L'ID du fournisseur est requis si le fournisseur d'authentification n'est pas LOCAL.",
  })
  // Une validation conditionnelle pourrait être ajoutée ici si providerId est obligatoire pour certains AuthProvider
  providerId?: string;

  // Ces champs peuvent être omis dans un DTO de création si leur valeur par défaut est gérée par la base de données
  // ou si vous souhaitez les contrôler explicitement lors de la création.
  // Pour cet exemple, je les ai inclus pour montrer comment les valider si nécessaire.

  @IsOptional()
  @IsBoolean({ message: 'Le champ isActive doit être un booléen.' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Le champ canCreateStore doit être un booléen.' })
  canCreateStore?: boolean;
}
