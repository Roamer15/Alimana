// import { Injectable } from '@nestjs/common';
// // ... autres imports
// import { AuditLogsService } from '../audit-logs/audit-logs.service';
// import { RequestContextService } from '../common/context/request-context.service';
// import { AuditActionType } from '../entities/audit-logs.entity'; // Importez AuditActionType de l'entité

// @Injectable()
// export class AuthService {
//   constructor(
//     // ... autres injections
//     private readonly auditLogsService: AuditLogsService,
//     private readonly requestContextService: RequestContextService,
//   ) {}

//   async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
//     // ... logique de validation des identifiants
//     const user = await this.validateUser(loginDto.email, loginDto.password);
//     if (!user) {
//       const { ipAddress, userAgent } = this.requestContextService.getContext();
//       await this.auditLogsService.createAuditLog({
//         storeId: null,
//         storeUserId: null,
//         actionType: AuditActionType.LOGIN,
//         entity: 'User',
//         entityId: null,
//         notes: `Tentative de connexion échouée pour l'email: ${loginDto.email}`,
//         ipAddress,
//         userAgent,
//       });
//       return null;
//     }

//     const tokens = await this.generateTokens(user);

//     const { ipAddress, userAgent } = this.requestContextService.getContext();
//     await this.auditLogsService.createAuditLog({
//       storeId: null,
//       storeUserId: user.id,
//       actionType: AuditActionType.LOGIN,
//       entity: 'User',
//       entityId: String(user.id),
//       notes: `Connexion réussie de l'utilisateur: ${user.email}`,
//       ipAddress,
//       userAgent,
//     });

//     return tokens;
//   }

//   async logout(userRefreshTokenId: number): Promise<void> {
//     // ... logique de déconnexion
//     const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
//     await this.auditLogsService.createAuditLog({
//       storeId,
//       storeUserId,
//       actionType: AuditActionType.LOGOUT,
//       entity: 'UserSession',
//       entityId: String(userRefreshTokenId),
//       notes: `Déconnexion de la session ${userRefreshTokenId}`,
//       ipAddress,
//       userAgent,
//     });
//   }

//   async changePassword(userId: number, oldPassword, newPassword): Promise<void> {
//     // ... logique de changement de mot de passe
//     const { storeId, storeUserId, ipAddress, userAgent } = this.requestContextService.getContext();
//     await this.auditLogsService.createAuditLog({
//       storeId,
//       storeUserId,
//       actionType: AuditActionType.PASSWORD_CHANGE,
//       entity: 'User',
//       entityId: String(userId),
//       notes: `Changement de mot de passe pour l'utilisateur ID: ${userId}`,
//       ipAddress,
//       userAgent,
//     });
//   }
// }
