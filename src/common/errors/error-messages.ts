// src/common/filters/error-messages.ts
import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes.enum';

export const ErrorMessages: Record<ErrorCode, { message: string; status: HttpStatus }> = {
  // Erreurs générales
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    message: 'Une erreur interne du serveur est survenue.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.UNAUTHORIZED]: {
    message: 'Authentification requise ou invalide.',
    status: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.FORBIDDEN]: {
    message: "Vous n'avez pas la permission d'accéder à cette ressource.",
    status: HttpStatus.FORBIDDEN,
  },
  [ErrorCode.NOT_FOUND]: {
    message: 'La ressource demandée est introuvable.',
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.BAD_REQUEST]: {
    message: 'La requête est invalide.',
    status: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.VALIDATION_FAILED]: {
    message: 'La validation des données a échoué.',
    status: HttpStatus.BAD_REQUEST,
  },

  // Erreurs d'authentification/utilisateur
  [ErrorCode.EMAIL_ALREADY_USED]: {
    message: 'Cet email est déjà utilisé.',
    status: HttpStatus.CONFLICT,
  },
  [ErrorCode.USER_NOT_FOUND]: {
    message: 'Utilisateur non trouvé.',
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.INVALID_CREDENTIALS]: {
    message: 'Identifiants invalides (email ou mot de passe incorrect).',
    status: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.REFRESH_TOKEN_INVALID]: {
    message: 'Jeton de rafraîchissement invalide.',
    status: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: {
    message: 'Jeton de rafraîchissement expiré. Veuillez vous reconnecter.',
    status: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.STORE_USER_NOT_FOUND]: {
    message: 'Relation utilisateur-boutique introuvable.',
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.STORE_NOT_FOUND]: {
    message: 'Boutique introuvable.',
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.UNAUTHORIZED_TO_CREATE_STORE]: {
    message: 'vous navez pas les permissions pour creer une boutique.',
    status: HttpStatus.UNAUTHORIZED,
  },

  // Erreurs spécifiques au domaine
  [ErrorCode.PRODUCT_NOT_FOUND]: {
    message: 'Produit introuvable.',
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.INSUFFICIENT_STOCK]: {
    message: 'Stock insuffisant pour ce produit.',
    status: HttpStatus.BAD_REQUEST,
  },
  [ErrorCode.SALE_NOT_FOUND]: {
    message: 'Vente introuvable.',
    status: HttpStatus.NOT_FOUND,
  },

  [ErrorCode.SUPPLIER_NOT_FOUND]: {
    message: 'Fournisseur introuvable.',
    status: HttpStatus.NOT_FOUND,
  },

  //Error messsages related to role management
  [ErrorCode.PERMISSION_NOT_FOUND]: {
    message: 'One or more permissions not found.',
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.ROLE_NOT_FOUND]: {
    message: 'Role not found.',
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.ROLE_CREATION_FAILED]: {
    message: 'Failed to create role.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.ROLE_UPDATE_FAILED]: {
    message: 'Failed to update role.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.ROLE_DELETE_FAILED]: {
    message: 'Failed to delete role.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.ROLE_FETCH_FAILED]: {
    message: 'Failed to fetch role.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.PERMISSION_FETCH_FAILED]: {
    message: 'Failed to fetch permissions.',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  // Cash register
  [ErrorCode.CASH_REGISTER_CREATION_FAILED]: {
    message: 'Cash register creation failed',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.CASH_REGISTER_FETCH_FAILED]: {
    message: 'Cash register fetch failed',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.CASH_REGISTER_NOT_FOUND]: {
    message: 'Cash register not found',
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.CASH_REGISTER_DELETE_FAILED]: {
    message: 'Cash register delete failed',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.CASH_REGISTER_UPDATE_FAILED]: {
    message: 'Cash register update failed',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.SESSION_ALREADY_OPEN]: {
    message: 'Session is already open',
    status: HttpStatus.CONFLICT,
  },
  [ErrorCode.SESSION_OPEN_FAILED]: {
    message: 'Session is already open',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.SESSION_CLOSE_FAILED]: {
    message: 'Session is already open',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [ErrorCode.SESSION_NOT_FOUND]: {
    message: 'Session is already open',
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.SESSION_NOT_FOUND_OR_CLOSED]: {
    message: 'Session is already open',
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.CONTEXT_INFO_NOTFOUND]: {
    message: 'les informations du context sont abscend',
    status: HttpStatus.NOT_FOUND,
  },
};
