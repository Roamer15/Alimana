// src/invitation/dto/invitation.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MinLength,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';

// DTO pour créer une invitation
export class CreateInvitationDto {
  @IsEmail({}, { message: "L'adresse email doit être valide." })
  @IsNotEmpty({ message: "L'adresse email est requise." })
  email: string;

  @IsNumber({}, { message: "L'ID du rôle doit être un nombre." })
  @IsNotEmpty({ message: "L'ID du rôle est requis." })
  roleId: number; // Le rôle que l'inviteur attribue à l'invité

  @IsString()
  @IsOptional()
  fullName?: string; // Nom complet de l'invité (optionnel, peut être fourni pour pré-remplir)
}

// DTO pour accepter une invitation
export class AcceptInvitationDto {
  @IsString({ message: 'Le token est requis.' })
  @IsNotEmpty({ message: 'Le token ne peut pas être vide.' })
  token: string; // Le token brut reçu par email

  @IsOptional()
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(60, { message: 'Le mot de passe ne doit pas dépasser 60 caractères.' })
  // Au moins une majuscule, une minuscule, un chiffre et un caractère spécial
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\\[\]|\\:;"'<>,.?/~`]).{8,60}$/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.',
  })
  password?: string; // Optionnel car l'authentification peut se faire via un fournisseur tiersF

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
}
