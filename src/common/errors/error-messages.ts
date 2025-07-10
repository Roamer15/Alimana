import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes.enum';

export const ErrorMessages = {
  [ErrorCode.USER_NOT_FOUND]: {
    message: "L'utilisateur n'existe pas",
    status: HttpStatus.NOT_FOUND,
  },
  [ErrorCode.EMAIL_ALREADY_USED]: {
    message: 'Cet email est déjà utilisé',
    status: HttpStatus.CONFLICT,
  },
  [ErrorCode.INVALID_CREDENTIALS]: {
    message: 'Identifiants invalides',
    status: HttpStatus.UNAUTHORIZED,
  },
  [ErrorCode.ACCESS_DENIED]: {
    message: 'Accès refusé',
    status: HttpStatus.FORBIDDEN,
  },
  [ErrorCode.VALIDATION_FAILED]: {
    message: 'Les données fournies sont invalides',
    status: HttpStatus.BAD_REQUEST,
  },
};
