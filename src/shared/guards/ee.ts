// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import {
//   ExceptionFilter,
//   Catch,
//   ArgumentsHost,
//   HttpException,
//   HttpStatus,
//   Logger, // Importez le module Logger
// } from '@nestjs/common';
// import { Request, Response } from 'express';
// import { ErrorCode } from './error-codes.enum'; // Assurez-vous que le chemin est correct
// import { ErrorMessages } from './error-messages'; // Assurez-vous que le chemin est correct

// // Interface pour la structure des réponses d'erreur personnalisées
// // Cette interface est utilisée pour typer le contenu de l'HttpException
// // lorsque throwHttpError est utilisé.
// interface CustomHttpExceptionResponse {
//   code: ErrorCode;
//   error: string; // Message d'erreur convivial
//   details?: any; // Détails supplémentaires (ex: erreurs de validation)
//   statusCode?: HttpStatus; // Optionnel, si l'erreur personnalisée a son propre statut HTTP
//   message?: string | string[]; // Pour les erreurs de validation de NestJS
// }

// @Catch()
// export class AllExceptionsFilter implements ExceptionFilter {
//   // Utilisation du Logger intégré de NestJS.
//   // Il est préférable d'injecter un MyLoggerService si vous avez une implémentation personnalisée plus complexe.
//   // Pour cet exemple, nous utilisons le Logger de NestJS directement.
//   private readonly logger = new Logger(AllExceptionsFilter.name);

//   catch(exception: unknown, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     const request = ctx.getRequest<Request>();

//     let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
//     let responseBody: {
//       code: ErrorCode;
//       error: string;
//       details?: any;
//     } = {
//       code: ErrorCode.INTERNAL_SERVER_ERROR,
//       error: ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR].message,
//     };

//     // Gérer les exceptions HTTP (y compris celles levées par throwHttpError)
//     if (exception instanceof HttpException) {
//       status = exception.getStatus();
//       const exceptionResponse = exception.getResponse();

//       // Vérifie si l'exception provient de notre fonction `throwHttpError`
//       // en vérifiant la présence de la propriété 'code' (qui est de type ErrorCode)
//       if (
//         typeof exceptionResponse === 'object' &&
//         exceptionResponse !== null &&
//         'code' in exceptionResponse &&
//         Object.values(ErrorCode).includes((exceptionResponse as CustomHttpExceptionResponse).code) // S'assurer que le code est un ErrorCode valide
//       ) {
//         const customResponse = exceptionResponse as CustomHttpExceptionResponse;
//         responseBody = {
//           code: customResponse.code,
//           error: customResponse.error,
//           ...(customResponse.details && { details: customResponse.details }),
//         };
//         // Log l'erreur client avec un niveau d'avertissement ou d'erreur selon le statut
//         if (status >= 500) {
//           this.logger.error(
//             `[${request.method}] ${request.url} - ${status} - Code: ${customResponse.code} - Error: ${customResponse.error}`,
//             (exception as Error).stack, // Inclure la stack pour les erreurs serveur
//             'AllExceptionsFilter',
//           );
//         } else {
//           this.logger.warn(
//             `[${request.method}] ${request.url} - ${status} - Code: ${customResponse.code} - Error: ${customResponse.error}`,
//             'AllExceptionsFilter',
//           );
//         }
//       }
//       // Cas 2: Erreur de validation de NestJS (souvent `BadRequestException` avec un tableau de messages)
//       else if (
//         typeof exceptionResponse === 'object' &&
//         exceptionResponse !== null &&
//         'message' in exceptionResponse &&
//         Array.isArray((exceptionResponse as any).message)
//       ) {
//         const validationMessages = (exceptionResponse as any).message as string[];
//         status = HttpStatus.BAD_REQUEST; // Les erreurs de validation sont généralement des 400
//         responseBody = {
//           code: ErrorCode.VALIDATION_FAILED,
//           error: ErrorMessages[ErrorCode.VALIDATION_FAILED].message,
//           details: validationMessages, // Les messages d'erreur de validation comme détails
//         };
//         this.logger.warn(
//           `[${request.method}] ${request.url} - ${status} - Validation Error: ${validationMessages.join(', ')}`,
//           'AllExceptionsFilter',
//         );
//       }
//       // Cas 3: Autres HttpException standard (message est une chaîne ou un objet générique)
//       else {
//         const errorMessage =
//           typeof exceptionResponse === 'string'
//             ? exceptionResponse
//             : (exceptionResponse as any)?.message ||
//               (exceptionResponse as any)?.error ||
//               'Requête invalide';

//         responseBody = {
//           code: ErrorCode.BAD_REQUEST, // Par défaut pour les erreurs HTTP génériques si pas de code spécifique
//           error: errorMessage,
//         };
//         this.logger.warn(
//           `[${request.method}] ${request.url} - ${status} - HTTP Error: ${errorMessage}`,
//           'AllExceptionsFilter',
//         );
//       }
//     }
//     // Gérer les erreurs JavaScript standard (TypeError, ReferenceError, etc.)
//     else if (exception instanceof Error) {
//       status = HttpStatus.INTERNAL_SERVER_ERROR;
//       responseBody = {
//         code: ErrorCode.INTERNAL_SERVER_ERROR,
//         error: ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR].message,
//         // N'exposez le message d'erreur détaillé que en environnement de développement
//         details: process.env.NODE_ENV === 'development' ? exception.message : undefined,
//       };
//       // Log l'erreur interne avec la pile d'appels
//       this.logger.error(
//         `[${request.method}] ${request.url} - ${status} - Internal Server Error: ${exception.message}`,
//         exception.stack,
//         'AllExceptionsFilter',
//       );
//     }
//     // Gérer les exceptions totalement inconnues
//     else {
//       status = HttpStatus.INTERNAL_SERVER_ERROR;
//       responseBody = {
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
//         code: ErrorCode.INTERNAL_SERVER_ERROR,
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
//         error: ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR].message,
//       };
//       this.logger.error(
//         `[${request.method}] ${request.url} - ${status} - Unknown Error: ${JSON.stringify(exception)}`,
//         'AllExceptionsFilter',
//       );
//     }

//     // Envoyer la réponse JSON standardisée au client
//     response.status(status).json({
//       statusCode: status,
//       timestamp: new Date().toISOString(),
//       path: request.url,
//       ...responseBody, // Inclut code, error, et details
//     });
//   }
// }
